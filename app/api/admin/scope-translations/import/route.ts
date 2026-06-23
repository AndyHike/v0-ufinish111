import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Papa from "papaparse"
import { revalidateCatalog } from "@/lib/revalidate-catalog"

const LOCALES = ["cs", "en", "uk"] as const
const SCOPES = ["model", "series", "brand"] as const

// Bulk import of per-locale scope text overrides into service_scope_translations.
// Accepts a multipart CSV (same columns as the export). Empty rows are no-ops
// (so a fillable template can be uploaded without wiping anything).
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Не передано файл (поле 'file')" }, { status: 400 })
    }

    const text = (await file.text()).replace(/^﻿/, "")
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
    const rows = (parsed.data as any[]) || []

    const supabase = await createClient()

    const svcCache = new Map<string, string | null>()
    const scopeCache = new Map<string, string | null>()
    const resolveService = async (slug: string) => {
      if (svcCache.has(slug)) return svcCache.get(slug)!
      const { data } = await supabase.from("services").select("id").eq("slug", slug).maybeSingle()
      const id = data?.id ?? null
      svcCache.set(slug, id)
      return id
    }
    const resolveScope = async (type: string, slug: string) => {
      const key = `${type}:${slug}`
      if (scopeCache.has(key)) return scopeCache.get(key)!
      const table = type === "model" ? "models" : type === "series" ? "series" : "brands"
      const { data } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle()
      const id = data?.id ?? null
      scopeCache.set(key, id)
      return id
    }

    let upserted = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []
    const touchedModelIds = new Set<string>()
    const touchedServiceIds = new Set<string>()
    const touchedSeriesIds = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const line = i + 2 // header is line 1
      try {
        const serviceSlug = String(row.service_slug || "").trim()
        const scopeType = String(row.scope_type || "model").trim().toLowerCase()
        const scopeSlug = String(row.scope_slug || "").trim()

        // collect this row's locale payloads
        const perLocale = LOCALES.map((loc) => ({
          loc,
          dd: String(row[`detailed_description_${loc}`] || "").trim(),
          wi: String(row[`what_included_${loc}`] || "").trim(),
          bf: String(row[`benefits_${loc}`] || "").trim(),
        }))
        const hasAnyText = perLocale.some((p) => p.dd || p.wi || p.bf)
        if (!hasAnyText) {
          skipped++
          continue // empty template row -> no-op (never deletes)
        }

        if (!serviceSlug || !scopeSlug) {
          errors++
          errorMessages.push(`Рядок ${line}: відсутній service_slug або scope_slug`)
          continue
        }
        if (!SCOPES.includes(scopeType as any)) {
          errors++
          errorMessages.push(`Рядок ${line}: невідомий scope_type "${scopeType}"`)
          continue
        }

        const serviceId = await resolveService(serviceSlug)
        if (!serviceId) {
          errors++
          errorMessages.push(`Рядок ${line}: послугу "${serviceSlug}" не знайдено`)
          continue
        }
        const scopeId = await resolveScope(scopeType, scopeSlug)
        if (!scopeId) {
          errors++
          errorMessages.push(`Рядок ${line}: ${scopeType} "${scopeSlug}" не знайдено`)
          continue
        }

        for (const p of perLocale) {
          if (!p.dd && !p.wi && !p.bf) continue // don't touch a locale left blank
          const { error } = await supabase.from("service_scope_translations").upsert(
            {
              service_id: serviceId,
              scope_type: scopeType,
              scope_id: scopeId,
              locale: p.loc,
              detailed_description: p.dd || null,
              what_included: p.wi || null,
              benefits: p.bf || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "service_id,scope_type,scope_id,locale" },
          )
          if (error) {
            errors++
            errorMessages.push(`Рядок ${line} (${p.loc}): ${error.message}`)
          } else {
            upserted++
          }
        }

        touchedServiceIds.add(serviceId)
        if (scopeType === "model") touchedModelIds.add(scopeId)
        else if (scopeType === "series") touchedSeriesIds.add(scopeId)
      } catch (e) {
        errors++
        errorMessages.push(`Рядок ${line}: ${(e as Error).message}`)
      }
    }

    // Best-effort cache refresh (non-fatal).
    try {
      await revalidateCatalog(supabase, {
        modelIds: touchedModelIds,
        serviceIds: touchedServiceIds,
        seriesIds: touchedSeriesIds,
      })
    } catch (e) {
      console.error("[scope-translations/import] revalidate error (non-fatal):", e)
    }

    return NextResponse.json({
      success: true,
      upserted,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 15),
    })
  } catch (error) {
    console.error("[scope-translations/import] error:", error)
    return NextResponse.json(
      { error: "Помилка імпорту: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
