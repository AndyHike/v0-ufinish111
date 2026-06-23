import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

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

    return csv("﻿" + Papa.unparse(csvRows))
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
