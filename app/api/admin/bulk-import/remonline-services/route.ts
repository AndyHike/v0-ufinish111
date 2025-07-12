import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import Papa from "papaparse"

type RemOnlineServiceRow = {
  Опис: string
  Категорія: string
  "Стандартна ціна": string | number
  Гарантія: string | number
  "Гарантійний період": string
  "Тривалість (хвилини)": string | number
  [key: string]: any
}

type ParsedService = {
  id: string
  slug: string | null
  brand: string | null
  series: string | null
  model: string | null
  price: number | null
  warranty_months: number | null
  warranty_period: "months" | "days" | null
  duration_hours: number | null
  original_description: string
  original_category: string
  service_found: boolean
  brand_found: boolean
  series_found: boolean
  model_found: boolean
  service_id: string | null
  brand_id: string | null
  series_id: string | null
  model_id: string | null
  errors: string[]
  needs_new_model: boolean
  suggested_model_name: string | null
}

function extractSlugFromDescription(description: string): string | null {
  const match = description.match(/\[([^\]]+)\]/)
  return match ? match[1] : null
}

function parseCategoryHierarchy(category: string): {
  brand: string | null
  series: string | null
  model: string | null
} {
  const parts = category.split(" > ").map((part) => part.trim())

  return {
    brand: parts[0] || null,
    series: parts[1] || null,
    model: parts[2] || null,
  }
}

function parseWarrantyPeriod(period: string): "months" | "days" | null {
  const normalized = period.toLowerCase().trim()
  if (normalized.includes("міс") || normalized.includes("month")) return "months"
  if (normalized.includes("дн") || normalized.includes("day")) return "days"
  return null
}

function parseNumber(value: string | number): number | null {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

function convertToWarrantyMonths(duration: number | null, period: "months" | "days" | null): number | null {
  if (!duration) return null

  if (period === "days") {
    // Convert days to months (approximately)
    return Math.round((duration / 30) * 100) / 100
  } else if (period === "months") {
    return duration
  }

  return duration // Default to months if period is unclear
}

function convertToHours(minutes: number | null): number | null {
  if (!minutes) return null
  return Math.round((minutes / 60) * 100) / 100 // Convert minutes to hours with 2 decimal places
}

export async function POST(request: Request) {
  try {
    const { csvData } = await request.json()

    if (!csvData || typeof csvData !== "string") {
      return NextResponse.json({ error: "CSV data is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Parse CSV
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing error",
          details: parseResult.errors,
        },
        { status: 400 },
      )
    }

    const rows = parseResult.data as RemOnlineServiceRow[]
    const parsedServices: ParsedService[] = []

    // Get all existing data for matching
    const [servicesResult, brandsResult, seriesResult, modelsResult] = await Promise.all([
      supabase.from("services").select("id, slug, name").order("name"),
      supabase.from("brands").select("id, name, slug"),
      supabase.from("series").select("id, name, slug, brand_id"),
      supabase.from("models").select("id, name, slug, brand_id, series_id"),
    ])

    const services = servicesResult.data || []
    const brands = brandsResult.data || []
    const series = seriesResult.data || []
    const models = modelsResult.data || []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const errors: string[] = []

      // Extract slug from description
      const slug = extractSlugFromDescription(row["Опис"] || "")

      // Parse category hierarchy
      const hierarchy = parseCategoryHierarchy(row["Категорія"] || "")

      // Parse numeric values
      const price = parseNumber(row["Стандартна ціна"])
      const warrantyDuration = parseNumber(row["Гарантія"])
      const durationMinutes = parseNumber(row["Тривалість (хвилини)"])
      const warrantyPeriod = parseWarrantyPeriod(row["Гарантійний період"] || "")

      // Convert to proper units
      const warrantyMonths = convertToWarrantyMonths(warrantyDuration, warrantyPeriod)
      const durationHours = convertToHours(durationMinutes)

      // Find matching records
      const foundService = slug ? services.find((s) => s.slug === slug) : null

      const foundBrand = hierarchy.brand
        ? brands.find(
            (b) =>
              b.name.toLowerCase() === hierarchy.brand?.toLowerCase() ||
              b.slug?.toLowerCase() === hierarchy.brand?.toLowerCase(),
          )
        : null

      const foundSeries =
        hierarchy.series && foundBrand
          ? series.find(
              (s) =>
                s.brand_id === foundBrand.id &&
                (s.name.toLowerCase() === hierarchy.series?.toLowerCase() ||
                  s.slug?.toLowerCase() === hierarchy.series?.toLowerCase()),
            )
          : null

      const foundModel =
        hierarchy.model && foundBrand
          ? models.find(
              (m) =>
                m.brand_id === foundBrand.id &&
                (m.name.toLowerCase() === hierarchy.model?.toLowerCase() ||
                  m.slug?.toLowerCase() === hierarchy.model?.toLowerCase()),
            )
          : null

      // Determine if we need to create a new model
      const needsNewModel = !foundModel && hierarchy.model && foundBrand
      const suggestedModelName = needsNewModel ? hierarchy.model : null

      // Collect errors (but not for missing models - we'll create them)
      if (!slug) errors.push("Slug не знайдено в описі")
      if (slug && !foundService) errors.push(`Послуга з slug "${slug}" не знайдена`)
      if (hierarchy.brand && !foundBrand) errors.push(`Бренд "${hierarchy.brand}" не знайдений`)
      if (hierarchy.series && !foundSeries) errors.push(`Серія "${hierarchy.series}" не знайдена`)

      const parsedService: ParsedService = {
        id: `temp_${i}`,
        slug,
        brand: hierarchy.brand,
        series: hierarchy.series,
        model: hierarchy.model,
        price,
        warranty_months: warrantyMonths,
        warranty_period: warrantyPeriod,
        duration_hours: durationHours,
        original_description: row["Опис"] || "",
        original_category: row["Категорія"] || "",
        service_found: !!foundService,
        brand_found: !!foundBrand,
        series_found: !!foundSeries,
        model_found: !!foundModel,
        service_id: foundService?.id || null,
        brand_id: foundBrand?.id || null,
        series_id: foundSeries?.id || null,
        model_id: foundModel?.id || null,
        errors,
        needs_new_model: needsNewModel,
        suggested_model_name: suggestedModelName,
      }

      parsedServices.push(parsedService)
    }

    // Return parsed data for preview
    return NextResponse.json({
      success: true,
      total: parsedServices.length,
      services: parsedServices,
      summary: {
        total: parsedServices.length,
        with_errors: parsedServices.filter((s) => s.errors.length > 0).length,
        services_found: parsedServices.filter((s) => s.service_found).length,
        brands_found: parsedServices.filter((s) => s.brand_found).length,
        series_found: parsedServices.filter((s) => s.series_found).length,
        models_found: parsedServices.filter((s) => s.model_found).length,
        new_models_needed: parsedServices.filter((s) => s.needs_new_model).length,
      },
    })
  } catch (error) {
    console.error("Error processing RemOnline import:", error)
    return NextResponse.json(
      { error: "Failed to process import", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
