import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const locale = searchParams.get("locale") || "cs"

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.toLowerCase().trim()
    console.log(`🔍 Searching for "${searchTerm}" in locale "${locale}"`)

    // Пошук брендів
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, slug, name")
      .ilike("name", `%${searchTerm}%`)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(5)

    if (brandsError) {
      console.error("❌ Brands search error:", brandsError)
    }

    // Пошук серій
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
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(5)

    if (seriesError) {
      console.error("❌ Series search error:", seriesError)
    }

    // Пошук моделей
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
      .eq("is_active", true)
      .order("position", { ascending: true })
      .limit(8)

    if (modelsError) {
      console.error("❌ Models search error:", modelsError)
    }

    // Пошук послуг через model_services
    const serviceNameColumn = `name_${locale}`
    const { data: modelServices, error: servicesError } = await supabase
      .from("model_services")
      .select(`
        id,
        service_id,
        services!inner(
          id,
          slug,
          ${serviceNameColumn},
          is_active
        ),
        models!inner(
          id,
          slug,
          name,
          brands!inner(
            id,
            slug,
            name
          )
        )
      `)
      .ilike(`services.${serviceNameColumn}`, `%${searchTerm}%`)
      .eq("services.is_active", true)
      .eq("models.is_active", true)
      .limit(5)

    if (servicesError) {
      console.error("❌ Services search error:", servicesError)
    }

    // Форматування результатів
    const results = []

    // Додаємо бренди
    if (brands) {
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

    // Додаємо серії
    if (series) {
      series.forEach((serie) => {
        results.push({
          id: serie.id,
          type: "series",
          name: serie.name,
          slug: serie.slug,
          url: `/${locale}/series/${serie.slug}`,
          breadcrumb: serie.brands.name,
        })
      })
    }

    // Додаємо моделі
    if (models) {
      models.forEach((model) => {
        results.push({
          id: model.id,
          type: "model",
          name: model.name,
          slug: model.slug,
          url: `/${locale}/models/${model.slug}`,
          breadcrumb: `${model.brands.name} › ${model.series.name}`,
        })
      })
    }

    // Додаємо послуги
    if (modelServices) {
      modelServices.forEach((ms) => {
        results.push({
          id: ms.services.id,
          type: "service",
          name: ms.services[serviceNameColumn],
          slug: ms.services.slug,
          url: `/${locale}/services/${ms.services.slug}`,
          breadcrumb: `${ms.models.brands.name} ${ms.models.name}`,
        })
      })
    }

    console.log(`✅ Found ${results.length} results`)

    return NextResponse.json({
      results,
      totalResults: results.length,
    })
  } catch (error) {
    console.error("❌ Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
