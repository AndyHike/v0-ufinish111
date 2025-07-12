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

    if (file.type !== "text/csv") {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have at least a header and one data row" }, { status: 400 })
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("CSV Headers:", headers)

    // Перевіряємо наявність обов'язкових колонок
    const requiredColumns = ["brand_name", "model_name", "service_name", "price"]
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json({ error: `Missing required columns: ${missingColumns.join(", ")}` }, { status: 400 })
    }

    // Функція для конвертації гарантії в місяці
    const convertToWarrantyMonths = (duration: string, period: string): number | null => {
      const durationNum = Number.parseFloat(duration)
      if (isNaN(durationNum)) return null

      switch (period?.toLowerCase()) {
        case "days":
        case "день":
        case "дні":
        case "днів":
          return Math.round(durationNum / 30) // Конвертуємо дні в місяці
        case "months":
        case "місяць":
        case "місяці":
        case "місяців":
          return Math.round(durationNum)
        case "years":
        case "рік":
        case "роки":
        case "років":
          return Math.round(durationNum * 12)
        default:
          return Math.round(durationNum) // За замовчуванням вважаємо місяцями
      }
    }

    // Функція для конвертації тривалості в години
    const convertToHours = (minutes: string): number | null => {
      const minutesNum = Number.parseFloat(minutes)
      if (isNaN(minutesNum)) return null
      return Math.round((minutesNum / 60) * 100) / 100 // Округлюємо до 2 знаків після коми
    }

    const data = lines.slice(1).map((line, index) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}

      headers.forEach((header, i) => {
        row[header] = values[i] || ""
      })

      // Конвертуємо дані
      const warrantyMonths = row.warranty_duration
        ? convertToWarrantyMonths(row.warranty_duration, row.warranty_period || "months")
        : null

      const durationHours = row.duration_minutes ? convertToHours(row.duration_minutes) : null

      return {
        rowIndex: index + 2, // +2 тому що рахуємо з 1 і пропускаємо заголовок
        brand_name: row.brand_name,
        model_name: row.model_name,
        service_name: row.service_name,
        price: row.price ? Number.parseFloat(row.price) : null,
        warranty_months: warrantyMonths,
        duration_hours: durationHours,
        warranty_period: row.warranty_period || "months",
        detailed_description: row.detailed_description || "",
        what_included: row.what_included || "",
        benefits: row.benefits || "",
        original_warranty_duration: row.warranty_duration || "",
        original_duration_minutes: row.duration_minutes || "",
      }
    })

    console.log("Parsed data sample:", data.slice(0, 3))

    return NextResponse.json({
      success: true,
      data,
      totalRows: data.length,
    })
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return NextResponse.json({ error: "Failed to parse CSV file" }, { status: 500 })
  }
}
