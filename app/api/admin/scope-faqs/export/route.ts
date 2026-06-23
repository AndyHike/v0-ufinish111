import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

// Stable column order — also guarantees a header row when there are no data rows
// (an empty table must still export a usable, fillable template, not a 0-byte file).
const COLUMNS = [
  "service_slug",
  "scope_type",
  "scope_slug",
  "name",
  "position",
  "question_cs",
  "answer_cs",
  "question_en",
  "answer_en",
  "question_uk",
  "answer_uk",
]

// A couple of fully-filled illustrative rows for the "Download example" button.
const EXAMPLE_ROWS: Record<string, string>[] = [
  {
    service_slug: "screen-replacement",
    scope_type: "model",
    scope_slug: "samsung-s24",
    name: "ПРИКЛАД — видаліть цей рядок перед імпортом",
    position: "0",
    question_cs: "Jak dlouho trvá výměna displeje Samsung Galaxy S24?",
    answer_cs: "Standardně 2–3 hodiny. Na výměnu dáváme záruku 6 měsíců.",
    question_en: "How long does a Samsung Galaxy S24 screen replacement take?",
    answer_en: "Usually 2–3 hours. The replacement comes with a 6-month warranty.",
    question_uk: "Скільки триває заміна дисплея Samsung Galaxy S24?",
    answer_uk: "Зазвичай 2–3 години. На заміну даємо гарантію 6 місяців.",
  },
  {
    service_slug: "screen-replacement",
    scope_type: "model",
    scope_slug: "samsung-s24",
    name: "ПРИКЛАД — видаліть цей рядок перед імпортом",
    position: "1",
    question_cs: "Používáte originální displeje?",
    answer_cs: "Nabízíme originální i kvalitní kompatibilní displeje – cenu i rozdíly vždy vysvětlíme předem.",
    question_en: "Do you use original displays?",
    answer_en: "We offer both original and high-quality compatible displays – we always explain the price and the differences first.",
    question_uk: "Чи використовуєте оригінальні дисплеї?",
    answer_uk: "Пропонуємо як оригінальні, так і якісні сумісні дисплеї – ціну та різницю завжди пояснюємо заздалегідь.",
  },
]

// Exports a fillable CSV template for scope FAQs (model/series). One row = one FAQ.
// Columns: service_slug, scope_type, scope_slug, name (readable), position,
//          question_{cs,en,uk}, answer_{cs,en,uk}
//
// By default returns the existing scope FAQs (so the owner can edit/extend them).
// Pass ?seriesId= / ?brandId= / ?modelId= to additionally emit a blank starter row
// per service for each matching model/series (a scaffold to fill in).
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const sp = request.nextUrl.searchParams
    const brandId = sp.get("brandId")
    const seriesId = sp.get("seriesId")
    const modelId = sp.get("modelId")

    if (sp.get("example") === "1") {
      return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: EXAMPLE_ROWS }))
    }

    const csvRows: Record<string, string>[] = []

    // 1) Existing scope FAQs, fully pre-filled.
    const { data: existing } = await supabase
      .from("service_scope_faqs")
      .select(
        `position, scope_type, scope_id,
         services!inner(slug),
         service_scope_faq_translations(locale, question, answer)`,
      )
      .order("position")

    // Resolve readable slug/name for each scope_id we encounter.
    const scopeMeta = new Map<string, { slug: string; name: string }>()
    const need = { model: new Set<string>(), series: new Set<string>() }
    ;(existing || []).forEach((r: any) => {
      if (r.scope_type === "model") need.model.add(r.scope_id)
      else if (r.scope_type === "series") need.series.add(r.scope_id)
    })
    for (const [type, ids] of [["model", need.model] as const, ["series", need.series] as const]) {
      if (ids.size === 0) continue
      const table = type === "model" ? "models" : "series"
      const { data } = await supabase.from(table).select("id, name, slug").in("id", [...ids])
      ;(data || []).forEach((s: any) => scopeMeta.set(`${type}:${s.id}`, { slug: s.slug, name: s.name }))
    }

    ;(existing || []).forEach((r: any) => {
      const svc = Array.isArray(r.services) ? r.services[0] : r.services
      const meta = scopeMeta.get(`${r.scope_type}:${r.scope_id}`)
      const out: Record<string, string> = {
        service_slug: svc?.slug || "",
        scope_type: r.scope_type,
        scope_slug: meta?.slug || "",
        name: meta?.name || "",
        position: String(r.position ?? 0),
      }
      for (const loc of LOCALES) {
        const tr = (r.service_scope_faq_translations || []).find((t: any) => t.locale === loc)
        out[`question_${loc}`] = tr?.question || ""
        out[`answer_${loc}`] = tr?.answer || ""
      }
      csvRows.push(out)
    })

    // 2) Optional blank scaffold rows for a target scope (one per service).
    if (brandId || seriesId || modelId) {
      const { data: services } = await supabase.from("services").select("slug").not("slug", "is", null)
      const scaffold = (scopeType: string, slug: string, name: string) => {
        ;(services || []).forEach((svc: any) => {
          const out: Record<string, string> = {
            service_slug: svc.slug,
            scope_type: scopeType,
            scope_slug: slug,
            name,
            position: "0",
          }
          for (const loc of LOCALES) {
            out[`question_${loc}`] = ""
            out[`answer_${loc}`] = ""
          }
          csvRows.push(out)
        })
      }
      if (modelId) {
        const { data } = await supabase.from("models").select("name, slug").eq("id", modelId).maybeSingle()
        if (data?.slug) scaffold("model", data.slug, data.name)
      } else if (seriesId) {
        const { data } = await supabase.from("series").select("name, slug").eq("id", seriesId).maybeSingle()
        if (data?.slug) scaffold("series", data.slug, data.name)
      } else if (brandId) {
        const { data } = await supabase.from("series").select("name, slug").eq("brand_id", brandId)
        ;(data || []).forEach((s: any) => s.slug && scaffold("series", s.slug, s.name))
      }
    }

    return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: csvRows }))
  } catch (error) {
    console.error("[scope-faqs/export] error:", error)
    return NextResponse.json(
      { error: "Failed to export", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

function csv(body: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scope_faqs_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
