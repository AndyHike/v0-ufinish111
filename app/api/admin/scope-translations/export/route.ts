import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { fetchAllRows } from "@/lib/admin/fetch-all-rows"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

// Stable column order — also guarantees a header row when there are no data rows.
const COLUMNS = [
  "service_slug",
  "scope_type",
  "scope_slug",
  "brand",
  "model",
  "series",
  "detailed_description_cs",
  "what_included_cs",
  "benefits_cs",
  "detailed_description_en",
  "what_included_en",
  "benefits_en",
  "detailed_description_uk",
  "what_included_uk",
  "benefits_uk",
]

// Fully-filled illustrative row for the "Download example" button.
const EXAMPLE_ROWS: Record<string, string>[] = [
  {
    service_slug: "screen-replacement",
    scope_type: "model",
    scope_slug: "samsung-s24",
    brand: "Samsung",
    model: "Samsung S24",
    series: "ПРИКЛАД — видаліть цей рядок перед імпортом",
    detailed_description_cs:
      "Výměna displeje Samsung Galaxy S24 v Praze 6 na Břevnově. Používáme originální i kvalitní kompatibilní displeje, opravu zvládneme obvykle do 2–3 hodin.",
    what_included_cs: "Nový displej, práce technika, otestování funkcí, záruka 6 měsíců.",
    benefits_cs: "Oprava do 2–3 hodin · Záruka 6 měsíců · Diagnostika zdarma",
    detailed_description_en:
      "Samsung Galaxy S24 screen replacement in Prague 6. We use both original and high-quality compatible displays and usually finish within 2–3 hours.",
    what_included_en: "New display, technician labour, function testing, 6-month warranty.",
    benefits_en: "Done in 2–3 hours · 6-month warranty · Free diagnostics",
    detailed_description_uk:
      "Заміна дисплея Samsung Galaxy S24 у Празі 6 на Бржевнові. Використовуємо оригінальні та якісні сумісні дисплеї, ремонт зазвичай за 2–3 години.",
    what_included_uk: "Новий дисплей, робота майстра, тестування функцій, гарантія 6 місяців.",
    benefits_uk: "Ремонт за 2–3 години · Гарантія 6 місяців · Діагностика безкоштовно",
  },
]

// Exports a fillable CSV template of model×service combinations with any existing
// per-locale overrides pre-filled. Columns:
//   service_slug, scope_type, scope_slug, brand, model (readable),
//   detailed_description_{cs,en,uk}, what_included_{cs,en,uk}, benefits_{cs,en,uk}
// Optional filters: ?brandId= / ?seriesId= / ?modelId= (same as services export).
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

    let modelIds: string[] | null = null
    if (seriesId) {
      const { data } = await supabase.from("models").select("id").eq("series_id", seriesId)
      modelIds = data?.map((m) => m.id) || []
    } else if (brandId) {
      const { data } = await supabase.from("models").select("id").eq("brand_id", brandId)
      modelIds = data?.map((m) => m.id) || []
    } else if (modelId) {
      modelIds = [modelId]
    }

    if (modelIds && modelIds.length === 0) {
      return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: [] }))
    }

    // Page through model_services — the table has thousands of rows and an unbounded
    // .select() truncates at ~1000, dropping most models from the template.
    const rows = await fetchAllRows((from, to) => {
      let query = supabase
        .from("model_services")
        .select(`
          service_id,
          services!inner(slug),
          models!inner(id, name, slug, brands!inner(name), series(name))
        `)
        .order("model_id")
        .order("service_id")
        .range(from, to)
      if (modelIds) {
        query = query.in("model_id", modelIds)
      }
      return query
    })

    // Existing model-scope overrides, keyed service_id|scope_id|locale.
    const overrides = await fetchAllRows((from, to) =>
      supabase
        .from("service_scope_translations")
        .select("service_id, scope_id, locale, detailed_description, what_included, benefits")
        .eq("scope_type", "model")
        .order("scope_id")
        .order("locale")
        .range(from, to),
    )

    const ov = new Map<string, any>()
    ;(overrides || []).forEach((o: any) => ov.set(`${o.service_id}|${o.scope_id}|${o.locale}`, o))

    const csvRows = (rows || []).map((r: any) => {
      const svc = Array.isArray(r.services) ? r.services[0] : r.services
      const model = Array.isArray(r.models) ? r.models[0] : r.models
      const brand = Array.isArray(model?.brands) ? model.brands[0] : model?.brands
      const series = Array.isArray(model?.series) ? model.series[0] : model?.series

      const out: Record<string, string> = {
        service_slug: svc?.slug || "",
        scope_type: "model",
        scope_slug: model?.slug || "",
        brand: brand?.name || "",
        model: model?.name || "",
        series: series?.name || "",
      }
      for (const loc of LOCALES) {
        const o = ov.get(`${r.service_id}|${model?.id}|${loc}`)
        out[`detailed_description_${loc}`] = o?.detailed_description || ""
        out[`what_included_${loc}`] = o?.what_included || ""
        out[`benefits_${loc}`] = o?.benefits || ""
      }
      return out
    })

    return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: csvRows }))
  } catch (error) {
    console.error("[scope-translations/export] error:", error)
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
      "Content-Disposition": `attachment; filename="scope_descriptions_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
