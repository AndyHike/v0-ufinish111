import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

const LOCALES = ["cs", "en", "uk"] as const

// Stable column order — also guarantees a header row when there are no data rows.
const COLUMNS = [
  "scope_type",
  "scope_slug",
  "name",
  "context",
  "description_cs",
  "body_cs",
  "description_en",
  "body_en",
  "description_uk",
  "body_uk",
]

// Fully-filled illustrative rows for the "Download example" button.
const EXAMPLE_ROWS: Record<string, string>[] = [
  {
    scope_type: "series",
    scope_slug: "galaxy-s",
    name: "Galaxy S",
    context: "ПРИКЛАД — видаліть цей рядок перед імпортом",
    description_cs:
      "Opravujeme všechny modely řady Samsung Galaxy S v Praze 6 na Břevnově – výměna displeje, baterie i zadního skla. Záruka 6 měsíců, většina oprav do 2–3 hodin.",
    body_cs:
      "U řady Galaxy S používáme originální i kvalitní kompatibilní díly a vždy předem vysvětlíme rozdíl v ceně. Diagnostika je zdarma, opravu obvykle stihneme tentýž den.",
    description_en:
      "We repair every Samsung Galaxy S model in Prague 6 – screen, battery and back-glass replacement with a 6-month warranty. Most repairs done within 2–3 hours.",
    body_en:
      "For the Galaxy S line we use both original and high-quality compatible parts and always explain the price difference up front. Diagnostics are free and most repairs are finished the same day.",
    description_uk:
      "Ремонтуємо всі моделі Samsung Galaxy S у Празі 6 на Бржевнові – заміна дисплея, батареї та заднього скла. Гарантія 6 місяців, більшість ремонтів за 2–3 години.",
    body_uk:
      "Для лінійки Galaxy S використовуємо оригінальні та якісні сумісні запчастини й завжди заздалегідь пояснюємо різницю в ціні. Діагностика безкоштовна, ремонт зазвичай встигаємо того ж дня.",
  },
  {
    scope_type: "model",
    scope_slug: "samsung-s24",
    name: "Samsung S24",
    context: "ПРИКЛАД — видаліть цей рядок перед імпортом",
    description_cs:
      "Profesionální oprava Samsung Galaxy S24 v Praze 6. Výměna displeje, baterie, nabíjecího konektoru i zadního skla se zárukou 6 měsíců.",
    body_cs: "",
    description_en:
      "Professional Samsung Galaxy S24 repair in Prague 6. Screen, battery, charging-port and back-glass replacement with a 6-month warranty.",
    body_en: "",
    description_uk:
      "Професійний ремонт Samsung Galaxy S24 у Празі 6. Заміна дисплея, батареї, роз'єму заряджання та заднього скла з гарантією 6 місяців.",
    body_uk: "",
  },
]

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

    if (sp.get("example") === "1") {
      return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: EXAMPLE_ROWS }))
    }

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

    return csv("﻿" + Papa.unparse({ fields: COLUMNS, data: csvRows }))
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
