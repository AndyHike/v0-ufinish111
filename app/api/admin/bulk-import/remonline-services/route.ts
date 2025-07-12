import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import Papa from "papaparse"

// Helper function to convert warranty duration to months
function convertToWarrantyMonths(duration: string, period: string): number {
  const durationNum = Number.parseInt(duration) || 0
  if (period === "days") {
    return Math.round(durationNum / 30) // Convert days to months
  }
  return durationNum // Already in months
}

// Helper function to convert minutes to hours
function convertToHours(minutes: string): number {
  const minutesNum = Number.parseInt(minutes) || 0
  return Math.round((minutesNum / 60) * 100) / 100 // Convert to hours with 2 decimal places
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()

    // Parse CSV
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors)
      return NextResponse.json({ error: "CSV parsing failed", details: parseResult.errors }, { status: 400 })
    }

    const csvData = parseResult.data as any[]
    console.log("Parsed CSV data:", csvData.slice(0, 3)) // Log first 3 rows

    // Transform and validate data
    const transformedData = csvData
      .map((row, index) => {
        try {
          // Required fields validation
          if (!row.model_name || !row.service_name) {
            console.warn(`Row ${index + 1}: Missing required fields`, row)
            return null
          }

          // Convert warranty data
          const warrantyMonths = convertToWarrantyMonths(row.warranty_duration || "0", row.warranty_period || "months")
          const durationHours = convertToHours(row.duration_minutes || "0")

          return {
            model_name: String(row.model_name).trim(),
            brand_name: String(row.brand_name || "").trim(),
            series_name: String(row.series_name || "").trim(),
            service_name: String(row.service_name).trim(),
            service_description: String(row.service_description || "").trim(),
            price: row.price ? Number.parseFloat(String(row.price).replace(/[^\d.-]/g, "")) : null,
            warranty_months: warrantyMonths,
            duration_hours: durationHours,
            warranty_period: row.warranty_period || "months",
            detailed_description: String(row.detailed_description || "").trim(),
            what_included: String(row.what_included || "").trim(),
            benefits: String(row.benefits || "").trim(),
            original_row: index + 1,
          }
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error, row)
          return null
        }
      })
      .filter(Boolean)

    console.log(`Processed ${transformedData.length} valid rows out of ${csvData.length}`)

    if (transformedData.length === 0) {
      return NextResponse.json({ error: "No valid data found in CSV" }, { status: 400 })
    }

    // Group by model for preview
    const groupedData = transformedData.reduce((acc, item) => {
      const key = `${item.brand_name}_${item.series_name}_${item.model_name}`.toLowerCase()
      if (!acc[key]) {
        acc[key] = {
          model_name: item.model_name,
          brand_name: item.brand_name,
          series_name: item.series_name,
          services: [],
        }
      }
      acc[key].services.push({
        service_name: item.service_name,
        service_description: item.service_description,
        price: item.price,
        warranty_months: item.warranty_months,
        duration_hours: item.duration_hours,
        warranty_period: item.warranty_period,
        detailed_description: item.detailed_description,
        what_included: item.what_included,
        benefits: item.benefits,
      })
      return acc
    }, {} as any)

    const previewData = Object.values(groupedData).slice(0, 10) // Limit preview to 10 models

    return NextResponse.json({
      success: true,
      preview: previewData,
      totalRows: transformedData.length,
      totalModels: Object.keys(groupedData).length,
      rawData: transformedData, // Include for saving
    })
  } catch (error) {
    console.error("Error processing CSV:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
