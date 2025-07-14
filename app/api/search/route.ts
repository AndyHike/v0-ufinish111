import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const locale = searchParams.get("locale") || "cs"

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], totalResults: 0 })
    }

    const searchTerm = query.toLowerCase().trim()
    console.log(`🔍 Searching for "${searchTerm}" in locale "${locale}"`)

    const results = []

    // Пошук брендів (без is_active)
    try {
      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("id, slug, name")
        .ilike("name", `%${searchTerm}%`)
        .order("position", { ascending: true })
        .limit(3)

      if (brandsError) {
        console.error("❌ Brands search error:", brandsError)
      } else if (brands) {
        brands.forEach((brand) => {
          results.push({
            id: brand.id,
            type: "brand",
            name: brand.name,
            slug: brand.slug,
            url: `/${locale}/brands/${brand.slug}`,
            breadcrumb: null,
          })
        })
      }
    } catch (error) {
      console.error("❌ Brands search failed:", error)
    }

    // Пошук серій (без is_active)
    try {
      const { data: series, error: seriesError } = await supabase
        .from("series")
        .select(`
          id,
          slug,
          name,
          brands!inner(
            id,
            slug,
            name
          )
        `)
        .ilike("name", `%${searchTerm}%`)
        .order("position", { ascending: true })
        .limit(3)

      if (seriesError) {
        console.error("❌ Series search error:", seriesError)
      } else if (series) {
        series.forEach((serie) => {
          results.push({
            id: serie.id,
            type: "series",
            name: serie.name,
            slug: serie.slug,
            url: `/${locale}/series/${serie.slug}`,
            breadcrumb: serie.brands?.name || null,
          })
        })
      }
    } catch (error) {
      console.error("❌ Series search failed:", error)
    }

    // Пошук моделей (без is_active)
    try {
      const { data: models, error: modelsError } = await supabase
        .from("models")
        .select(`
          id,
          slug,
          name,
          brands!inner(
            id,
            slug,
            name
          ),
          series!inner(
            id,
            slug,
            name
          )
        `)
        .ilike("name", `%${searchTerm}%`)
        .order("position", { ascending: true })
        .limit(5)

      if (modelsError) {
        console.error("❌ Models search error:", modelsError)
      } else if (models) {
        models.forEach((model) => {
          results.push({
            id: model.id,
            type: "model",
            name: model.name,
            slug: model.slug,
            url: `/${locale}/models/${model.slug}`,
            breadcrumb: `${model.brands?.name || ""} › ${model.series?.name || ""}`,
          })
        })
      }
    } catch (error) {
      console.error("❌ Models search failed:", error)
    }

    // Пошук послуг через services та services_translations (множина)
    try {
      const { data: servicesWithTranslations, error: servicesError } = await supabase
        .from("services")
        .select(`
          id,
          slug,
          services_translations!inner(
            name,
            locale
          )
        `)
        .eq("services_translations.locale", locale)
        .ilike("services_translations.name", `%${searchTerm}%`)
        .limit(3)

      if (servicesError) {
        console.error("❌ Services search error:", servicesError)
      } else if (servicesWithTranslations) {
        servicesWithTranslations.forEach((service) => {
          const translation = service.services_translations?.[0]
          if (translation) {
            results.push({
              id: service.id,
              type: "service",
              name: translation.name,
              slug: service.slug,
              url: `/${locale}/services/${service.slug}`,
              breadcrumb: null,
            })
          }
        })
      }
    } catch (error) {
      console.error("❌ Services search failed:", error)
    }

    console.log(`✅ Found ${results.length} results`)

    return NextResponse.json({
      results,
      totalResults: results.length,
    })
  } catch (error) {
    console.error("❌ Search API error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        results: [],
        totalResults: 0,
      },
      { status: 500 },
    )
  }
}
