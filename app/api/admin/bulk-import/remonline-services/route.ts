import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("Processing CSV file:", file.name)

    // Read and parse CSV
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have at least a header and one data row" }, { status: 400 })
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("CSV Header:", header)

    // Expected columns
    const expectedColumns = [
      "brand_name",
      "series_name",
      "model_name",
      "service_name",
      "price",
      "warranty_duration",
      "warranty_period",
      "duration_minutes",
      "detailed_description",
      "what_included",
      "benefits",
    ]

    // Check if all required columns are present
    const missingColumns = expectedColumns.filter((col) => !header.includes(col))
    if (missingColumns.length > 0) {
      return NextResponse.json({ error: `Missing required columns: ${missingColumns.join(", ")}` }, { status: 400 })
    }

    // Parse data rows
    const services = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

      if (values.length !== header.length) {
        console.warn(`Row ${i + 1} has ${values.length} values but header has ${header.length} columns`)
        continue
      }

      const rowData: any = {}
      header.forEach((col, index) => {
        rowData[col] = values[index] || ""
      })

      // Convert warranty duration to months
      const convertToWarrantyMonths = (duration: string, period: string): number | null => {
        const durationNum = Number.parseFloat(duration)
        if (isNaN(durationNum)) return null

        if (period.toLowerCase().includes("day")) {
          return Math.round(durationNum / 30) // Convert days to months
        } else if (period.toLowerCase().includes("month")) {
          return durationNum
        }
        return durationNum // Default to months
      }

      // Convert duration minutes to hours
      const convertToHours = (minutes: string): number | null => {
        const minutesNum = Number.parseFloat(minutes)
        if (isNaN(minutesNum)) return null
        return Math.round((minutesNum / 60) * 100) / 100 // Round to 2 decimal places
      }

      const service = {
        brand_name: rowData.brand_name,
        series_name: rowData.series_name,
        model_name: rowData.model_name,
        service_name: rowData.service_name,
        price: rowData.price ? Number.parseFloat(rowData.price) : null,
        warranty_months: convertToWarrantyMonths(rowData.warranty_duration, rowData.warranty_period),
        warranty_period: rowData.warranty_period?.toLowerCase().includes("day") ? "days" : "months",
        duration_hours: convertToHours(rowData.duration_minutes),
        detailed_description: rowData.detailed_description || null,
        what_included: rowData.what_included || null,
        benefits: rowData.benefits || null,
      }

      services.push(service)
    }

    console.log(`Parsed ${services.length} services from CSV`)

    return NextResponse.json({
      success: true,
      services,
      total: services.length,
    })
  } catch (error) {
    console.error("Error processing CSV:", error)
    return NextResponse.json({ error: "Failed to process CSV file" }, { status: 500 })
  }
}
