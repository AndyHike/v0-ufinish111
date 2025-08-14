import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const isPreview = formData.get("preview") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    const fileName = file.name.toLowerCase()
    const isCSV = file.type === "text/csv" || fileName.endsWith(".csv")
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls")

    if (!isCSV && !isExcel) {
      return NextResponse.json(
        {
          error: "Only CSV and Excel files are allowed (.csv, .xlsx, .xls)",
        },
        { status: 400 },
      )
    }

    let data: any[][] = []
    let headers: string[] = []

    if (isCSV) {
      // Handle CSV files
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        return NextResponse.json(
          {
            error: "CSV file must have at least a header and one data row",
          },
          { status: 400 },
        )
      }

      headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      data = lines.slice(1).map((line) => line.split(",").map((v) => v.trim().replace(/"/g, "")))
    } else {
      // Handle Excel files
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })

      // Get first worksheet
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      if (jsonData.length < 2) {
        return NextResponse.json(
          {
            error: "Excel file must have at least a header and one data row",
          },
          { status: 400 },
        )
      }

      headers = jsonData[0].map((h: any) => String(h || "").trim())
      data = jsonData.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
    }

    console.log("File Headers:", headers)
    console.log("Data rows:", data.length)

    // Check required columns
    const requiredColumns = ["brand_name", "model_name", "service_name", "price"]
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col))

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(", ")}. Available columns: ${headers.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Function to convert warranty to months
    const convertToWarrantyMonths = (duration: string, period: string): number | null => {
      const durationNum = Number.parseFloat(String(duration || ""))
      if (isNaN(durationNum)) return null

      switch (String(period || "").toLowerCase()) {
        case "days":
        case "день":
        case "дні":
        case "днів":
          return Math.round(durationNum / 30)
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
          return Math.round(durationNum)
      }
    }

    // Function to convert duration to hours
    const convertToHours = (minutes: string): number | null => {
      const minutesNum = Number.parseFloat(String(minutes || ""))
      if (isNaN(minutesNum)) return null
      return Math.round((minutesNum / 60) * 100) / 100
    }

    const processedData = data
      .map((row, index) => {
        const rowData: any = {}

        headers.forEach((header, i) => {
          rowData[header] = row[i] || ""
        })

        // Convert data
        const warrantyMonths = rowData.warranty_duration
          ? convertToWarrantyMonths(rowData.warranty_duration, rowData.warranty_period || "months")
          : null

        const durationHours = rowData.duration_minutes ? convertToHours(rowData.duration_minutes) : null

        return {
          rowIndex: index + 2, // +2 because we count from 1 and skip header
          brand_name: String(rowData.brand_name || "").trim(),
          model_name: String(rowData.model_name || "").trim(),
          service_name: String(rowData.service_name || "").trim(),
          price: rowData.price ? Number.parseFloat(String(rowData.price)) : null,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          warranty_period: String(rowData.warranty_period || "months"),
          detailed_description: String(rowData.detailed_description || "").trim(),
          what_included: String(rowData.what_included || "").trim(),
          benefits: String(rowData.benefits || "").trim(),
          original_warranty_duration: String(rowData.warranty_duration || ""),
          original_duration_minutes: String(rowData.duration_minutes || ""),
        }
      })
      .filter(
        (item) =>
          // Filter out empty rows
          item.brand_name && item.model_name && item.service_name,
      )

    console.log("Processed data sample:", processedData.slice(0, 3))

    return NextResponse.json({
      success: true,
      data: processedData,
      totalRows: processedData.length,
      fileType: isCSV ? "CSV" : "Excel",
      originalHeaders: headers,
    })
  } catch (error) {
    console.error("Error parsing file:", error)
    return NextResponse.json(
      {
        error: `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
