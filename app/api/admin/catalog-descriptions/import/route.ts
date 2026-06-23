import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Papa from "papaparse"
import { revalidateCatalog } from "@/lib/revalidate-catalog"

const LOCALES = ["cs", "en", "uk"] as const
const SCOPES = ["model", "series", "brand"] as const

// Bulk import of per-locale catalog PAGE descriptions into catalog_descriptions.
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

    const scopeCache = new Map<string, string | null>()
    const resolveScope = async (type: string, slug: string) => {
      const key = `${type}:${slug}`
      if (scopeCache.has(key)) return scopeCache.get(key)!
      const table = type === "model" ? "models" : type === "series" ? "series" : "brands"
      // Brand slugs are inconsistently cased in the DB → match case-insensitively.
      const { data } = await supabase.from(table).select("id").ilike("slug", slug).maybeSingle()
      const id = data?.id ?? null
      scopeCache.set(key, id)
      return id
    }

    let upserted = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []
    const touchedModelIds = new Set<string>()
    const touchedSeriesIds = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const line = i + 2 // header is line 1
      try {
        const scopeType = String(row.scope_type || "").trim().toLowerCase()
        const scopeSlug = String(row.scope_slug || "").trim()

        const perLocale = LOCALES.map((loc) => ({
          loc,
          desc: String(row[`description_${loc}`] || "").trim(),
          body: String(row[`body_${loc}`] || "").trim(),
        }))
        const hasAnyText = perLocale.some((p) => p.desc || p.body)
        if (!hasAnyText) {
          skipped++
          continue // empty template row -> no-op (never deletes)
        }

        if (!scopeType || !scopeSlug) {
          errors++
          errorMessages.push(`Рядок ${line}: відсутній scope_type або scope_slug`)
          continue
        }
        if (!SCOPES.includes(scopeType as any)) {
          errors++
          errorMessages.push(`Рядок ${line}: невідомий scope_type "${scopeType}"`)
          continue
        }

        const scopeId = await resolveScope(scopeType, scopeSlug)
        if (!scopeId) {
          errors++
          errorMessages.push(`Рядок ${line}: ${scopeType} "${scopeSlug}" не знайдено`)
          continue
        }

        for (const p of perLocale) {
          if (!p.desc && !p.body) continue // don't touch a locale left blank
          const { error } = await supabase.from("catalog_descriptions").upsert(
            {
              scope_type: scopeType,
              scope_id: scopeId,
              locale: p.loc,
              description: p.desc || null,
              body: p.body || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "scope_type,scope_id,locale" },
          )
          if (error) {
            errors++
            errorMessages.push(`Рядок ${line} (${p.loc}): ${error.message}`)
          } else {
            upserted++
          }
        }

        if (scopeType === "model") touchedModelIds.add(scopeId)
        else if (scopeType === "series") touchedSeriesIds.add(scopeId)
      } catch (e) {
        errors++
        errorMessages.push(`Рядок ${line}: ${(e as Error).message}`)
      }
    }

    // Best-effort cache refresh (non-fatal). Brand-level rows refresh on ISR.
    try {
      await revalidateCatalog(supabase, {
        modelIds: touchedModelIds,
        seriesIds: touchedSeriesIds,
        modelDetail: true,
      })
    } catch (e) {
      console.error("[catalog-descriptions/import] revalidate error (non-fatal):", e)
    }

    return NextResponse.json({
      success: true,
      upserted,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 15),
    })
  } catch (error) {
    console.error("[catalog-descriptions/import] error:", error)
    return NextResponse.json(
      { error: "Помилка імпорту: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
