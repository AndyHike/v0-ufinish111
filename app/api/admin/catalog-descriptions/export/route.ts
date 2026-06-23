import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

// Exports a fillable CSV template of catalog PAGES (brand / series / model) with any
// existing per-locale page descriptions pre-filled. Columns:
//   scope_type, scope_slug, name (readable), context (brand/series readable),
//   description_{cs,en,uk}, body_{cs,en,uk}
//
// By default the template lists brands + series (the high-leverage, low-volume hub
// pages). Pass ?brandId= / ?seriesId= / ?modelId= to also include the matching models
// (kept out of the default so the file doesn't balloon to thousands of rows).
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const sp = request.nextUrl.searchParams
    const brandId = sp.get("brandId")
    const seriesId = sp.get("seriesId")
    const modelId = sp.get("modelId")

    // Existing overrides, keyed scope_type|scope_id|locale.
    const { data: overrides } = await supabase
      .from("catalog_descriptions")
      .select("scope_type, scope_id, locale, description, body")
    const ov = new Map<string, any>()
    ;(overrides || []).forEach((o: any) => ov.set(`${o.scope_type}|${o.scope_id}|${o.locale}`, o))

    const csvRows: Record<string, string>[] = []
    const pushRow = (scopeType: string, scopeId: string, slug: string, name: string, context: string) => {
      const out: Record<string, string> = {
        scope_type: scopeType,
        scope_slug: slug,
        name,
        context,
      }
      for (const loc of LOCALES) {
        const o = ov.get(`${scopeType}|${scopeId}|${loc}`)
        out[`description_${loc}`] = o?.description || ""
        out[`body_${loc}`] = o?.body || ""
      }
      csvRows.push(out)
    }

    const onlyModels = Boolean(brandId || seriesId || modelId)

    if (!onlyModels) {
      const { data: brands } = await supabase.from("brands").select("id, name, slug").not("slug", "is", null)
      ;(brands || []).forEach((b: any) => pushRow("brand", b.id, String(b.slug).toLowerCase(), b.name, ""))

      const { data: series } = await supabase
        .from("series")
        .select("id, name, slug, brands(name)")
        .not("slug", "is", null)
      ;(series || []).forEach((s: any) => {
        const brand = Array.isArray(s.brands) ? s.brands[0] : s.brands
        pushRow("series", s.id, s.slug, s.name, brand?.name || "")
      })
    } else {
      let q = supabase.from("models").select("id, name, slug, brands(name), series(name)").not("slug", "is", null)
      if (modelId) q = q.eq("id", modelId)
      else if (seriesId) q = q.eq("series_id", seriesId)
      else if (brandId) q = q.eq("brand_id", brandId)
      const { data: models } = await q
      ;(models || []).forEach((m: any) => {
        const brand = Array.isArray(m.brands) ? m.brands[0] : m.brands
        const series = Array.isArray(m.series) ? m.series[0] : m.series
        pushRow("model", m.id, m.slug, m.name, [brand?.name, series?.name].filter(Boolean).join(" / "))
      })
    }

    return csv("﻿" + Papa.unparse(csvRows))
  } catch (error) {
    console.error("[catalog-descriptions/export] error:", error)
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
      "Content-Disposition": `attachment; filename="catalog_descriptions_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}
