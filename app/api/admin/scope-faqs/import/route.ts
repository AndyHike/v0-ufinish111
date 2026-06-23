import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import Papa from "papaparse"
import { revalidateCatalog } from "@/lib/revalidate-catalog"

const LOCALES = ["cs", "en", "uk"] as const
const SCOPES = ["model", "series"] as const
const SITE_LOCALES = ["cs", "en", "uk"] as const

// Bulk import of scope FAQs into service_scope_faqs (+ translations). One CSV row
// = one FAQ entry, keyed by (service, scope, position) so re-imports upsert in
// place. Empty rows (no question/answer anywhere) are no-ops; a locale is only
// written when BOTH its question and answer are present.
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
      const table = type === "model" ? "models" : "series"
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
    const touchedSeriesIds = new Set<string>()
    const modelPaths = new Set<string>() // `${serviceSlug}|${modelSlug}` for direct path revalidation

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const line = i + 2 // header is line 1
      try {
        const serviceSlug = String(row.service_slug || "").trim()
        const scopeType = String(row.scope_type || "").trim().toLowerCase()
        const scopeSlug = String(row.scope_slug || "").trim()
        const position = Number.parseInt(String(row.position || "0"), 10) || 0

        const perLocale = LOCALES.map((loc) => ({
          loc,
          q: String(row[`question_${loc}`] || "").trim(),
          a: String(row[`answer_${loc}`] || "").trim(),
        }))
        const usable = perLocale.filter((p) => p.q && p.a)
        if (usable.length === 0) {
          skipped++
          continue // empty/partial row -> no-op
        }

        if (!serviceSlug || !scopeSlug) {
          errors++
          errorMessages.push(`Рядок ${line}: відсутній service_slug або scope_slug`)
          continue
        }
        if (!SCOPES.includes(scopeType as any)) {
          errors++
          errorMessages.push(`Рядок ${line}: scope_type має бути model або series ("${scopeType}")`)
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

        // Upsert the FAQ row (keyed by service+scope+position) and get its id.
        const { data: faqRow, error: faqErr } = await supabase
          .from("service_scope_faqs")
          .upsert(
            {
              service_id: serviceId,
              scope_type: scopeType,
              scope_id: scopeId,
              position,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "service_id,scope_type,scope_id,position" },
          )
          .select("id")
          .single()
        if (faqErr || !faqRow) {
          errors++
          errorMessages.push(`Рядок ${line}: ${faqErr?.message || "не вдалося зберегти FAQ"}`)
          continue
        }

        for (const p of usable) {
          const { error: trErr } = await supabase.from("service_scope_faq_translations").upsert(
            { faq_id: faqRow.id, locale: p.loc, question: p.q, answer: p.a },
            { onConflict: "faq_id,locale" },
          )
          if (trErr) {
            errors++
            errorMessages.push(`Рядок ${line} (${p.loc}): ${trErr.message}`)
          } else {
            upserted++
          }
        }

        if (scopeType === "model") {
          touchedModelIds.add(scopeId)
          modelPaths.add(`${serviceSlug}|${scopeSlug}`)
        } else if (scopeType === "series") {
          touchedSeriesIds.add(scopeId)
        }
      } catch (e) {
        errors++
        errorMessages.push(`Рядок ${line}: ${(e as Error).message}`)
      }
    }

    // Best-effort cache refresh (non-fatal).
    try {
      await revalidateCatalog(supabase, {
        modelIds: touchedModelIds,
        seriesIds: touchedSeriesIds,
        modelDetail: true,
      })
      // FAQs render on the service+model page; refresh those paths directly.
      for (const pair of modelPaths) {
        const [svc, mdl] = pair.split("|")
        for (const loc of SITE_LOCALES) revalidatePath(`/${loc}/services/${svc}/${mdl}`, "page")
      }
    } catch (e) {
      console.error("[scope-faqs/import] revalidate error (non-fatal):", e)
    }

    return NextResponse.json({
      success: true,
      upserted,
      skipped,
      errors,
      errorMessages: errorMessages.slice(0, 15),
    })
  } catch (error) {
    console.error("[scope-faqs/import] error:", error)
    return NextResponse.json(
      { error: "Помилка імпорту: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
