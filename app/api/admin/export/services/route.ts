import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    
    // Get filter parameters
    const brandId = searchParams.get("brandId")
    const seriesId = searchParams.get("seriesId")
    const modelId = searchParams.get("modelId")

    // First, get the filtered model IDs if we have brand or series filters
    let filteredModelIds: string[] | null = null
    
    if (seriesId) {
      // Get all models for this series
      const { data: models } = await supabase
        .from("models")
        .select("id")
        .eq("series_id", seriesId)
      filteredModelIds = models?.map(m => m.id) || []
    } else if (brandId) {
      // Get all models for this brand
      const { data: models } = await supabase
        .from("models")
        .select("id")
        .eq("brand_id", brandId)
      filteredModelIds = models?.map(m => m.id) || []
    } else if (modelId) {
      filteredModelIds = [modelId]
    }

    // Build query with filters
    let query = supabase.from("model_services").select(`
        id,
        price,
        warranty_months,
        duration_hours,
        detailed_description,
        models!inner(
          id,
          name,
          series!inner(
            id,
            name
          ),
          brands!inner(
            id,
            name
          )
        ),
        services!inner(
          id
        )
      `)

    // Apply model ID filter if we have one
    if (filteredModelIds && filteredModelIds.length > 0) {
      query = query.in("model_id", filteredModelIds)
    } else if (filteredModelIds && filteredModelIds.length === 0) {
      // No models found for the filter - return empty CSV
      const csv = Papa.unparse([])
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="services_export_empty_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    const { data: modelServices, error } = await query

    if (error) {
      throw error
    }

    console.log("[v0] Export API - Retrieved model services:", modelServices?.length || 0)
    if (modelServices && modelServices.length > 0) {
      console.log("[v0] First service warranty_months:", modelServices[0].warranty_months)
      console.log("[v0] First service object keys:", Object.keys(modelServices[0]))
    }

    // Get all service translations
    const { data: allTranslations, error: translationsError } = await supabase
      .from("services_translations")
      .select("service_id, name, description, locale")

    if (translationsError) {
      throw translationsError
    }

    // Group translations by service_id and locale
    const translationsByService = allTranslations.reduce((acc, translation) => {
      if (!acc[translation.service_id]) {
        acc[translation.service_id] = {}
      }
      acc[translation.service_id][translation.locale] = {
        name: translation.name,
        description: translation.description,
      }
      return acc
    }, {})

    // Transform data for CSV export
    const csvData = modelServices.map((ms) => {
      const translations = translationsByService[ms.services.id] || {}

      return {
        brand: ms.models.brands.name,
        series: ms.models.series.name,
        model: ms.models.name,
        service_uk: translations.uk?.name || "",
        description_uk: translations.uk?.description || "",
        service_en: translations.en?.name || "",
        description_en: translations.en?.description || "",
        service_cs: translations.cs?.name || "",
        description_cs: translations.cs?.description || "",
        price: ms.price === null ? "" : ms.price,
        warranty_months: ms.warranty_months || "",
        duration_hours: ms.duration_hours || "",
        detailed_description: ms.detailed_description || "",
      }
    })

    // Convert to CSV
    const csv = Papa.unparse(csvData)
    
    // Create filename based on filter
    let filename = "services_export"
    if (modelId) {
      const modelName = modelServices[0]?.models?.name || "model"
      filename = `services_export_${modelName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
    } else if (seriesId) {
      const seriesName = modelServices[0]?.models?.series?.name || "series"
      filename = `services_export_${seriesName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
    } else if (brandId) {
      const brandName = modelServices[0]?.models?.brands?.name || "brand"
      filename = `services_export_${brandName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
    }
    filename += `_${new Date().toISOString().split("T")[0]}.csv`

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting services:", error)
    return NextResponse.json(
      { error: "Failed to export services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
