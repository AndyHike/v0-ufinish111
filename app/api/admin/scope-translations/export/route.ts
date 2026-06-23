import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

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
      return csv("﻿" + Papa.unparse([]))
    }

    let query = supabase.from("model_services").select(`
      service_id,
      services!inner(slug),
      models!inner(id, name, slug, brands!inner(name), series(name))
    `)
    if (modelIds) {
      query = query.in("model_id", modelIds)
    }

    const { data: rows, error } = await query
    if (error) throw error

    // Existing model-scope overrides, keyed service_id|scope_id|locale.
    const { data: overrides } = await supabase
      .from("service_scope_translations")
      .select("service_id, scope_id, locale, detailed_description, what_included, benefits")
      .eq("scope_type", "model")

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

    return csv("﻿" + Papa.unparse(csvRows))
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
