import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"

interface ImportData {
  name: string
  price: string
  category?: string
  description?: string
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string

    if (!file) {
      return NextResponse.json({ error: "Файл не знайдено" }, { status: 400 })
    }

    let data: ImportData[] = []

    // Parse the file based on type
    if (fileName.endsWith(".json")) {
      // Data already parsed and sent as JSON
      const text = await file.text()
      data = JSON.parse(text)
    } else if (fileName.endsWith(".csv")) {
      // Parse CSV
      const text = await file.text()
      data = parseCSV(text)
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // Parse Excel
      const buffer = await file.arrayBuffer()
      data = parseExcel(buffer)
    } else {
      return NextResponse.json({ error: "Непідтримуваний формат файлу" }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "Файл порожній або має неправильний формат" }, { status: 400 })
    }

    // Import data to database
    const result = await importServices(data)

    return NextResponse.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
      total: data.length,
      fileName,
      fileType,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Помилка імпорту даних" }, { status: 500 })
  }
}

function parseCSV(text: string): ImportData[] {
  const lines = text.split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const data: ImportData[] = []

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: ImportData = { name: "", price: "" }

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      if (row.name && row.price) {
        data.push(row)
      }
    }
  }

  return data
}

function parseExcel(buffer: ArrayBuffer): ImportData[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

  if (jsonData.length < 2) return []

  const headers = jsonData[0].map((h: any) => String(h).trim())
  const data: ImportData[] = []

  for (let i = 1; i < jsonData.length; i++) {
    if (jsonData[i] && jsonData[i].some((cell: any) => cell !== undefined && cell !== "")) {
      const row: ImportData = { name: "", price: "" }

      headers.forEach((header, index) => {
        row[header] = String(jsonData[i][index] || "").trim()
      })

      if (row.name && row.price) {
        data.push(row)
      }
    }
  }

  return data
}

async function importServices(data: ImportData[]) {
  const supabase = createClient()
  const errors: string[] = []
  let imported = 0

  for (const item of data) {
    try {
      // Validate required fields
      if (!item.name || !item.price) {
        errors.push(`Пропущено обов'язкові поля для запису: ${item.name || "Без назви"}`)
        continue
      }

      // Parse price
      const price = Number.parseFloat(
        item.price
          .toString()
          .replace(/[^\d.,]/g, "")
          .replace(",", "."),
      )
      if (isNaN(price)) {
        errors.push(`Неправильна ціна для послуги: ${item.name}`)
        continue
      }

      // Check if service already exists
      const { data: existingService } = await supabase
        .from("remonline_services")
        .select("id")
        .eq("name", item.name)
        .single()

      if (existingService) {
        errors.push(`Послуга вже існує: ${item.name}`)
        continue
      }

      // Insert service
      const { error } = await supabase.from("remonline_services").insert({
        name: item.name,
        price: price,
        category: item.category || null,
        description: item.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        errors.push(`Помилка додавання послуги ${item.name}: ${error.message}`)
      } else {
        imported++
      }
    } catch (error) {
      errors.push(`Неочікувана помилка для послуги ${item.name}: ${error}`)
    }
  }

  return { imported, errors }
}
