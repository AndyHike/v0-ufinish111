import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    const supabase = createClient()

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        if (!row.name) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Відсутня назва`)
          continue
        }

        const brandData = {
          name: row.name,
          slug: row.slug || createSlug(row.name),
          position: row.position ? Number.parseInt(row.position) : null,
        }

        if (row.existingId) {
          // Оновлюємо існуючий бренд
          const { error } = await supabase.from("brands").update(brandData).eq("id", row.existingId)

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: ${error.message}`)
          } else {
            updated++
          }
        } else {
          // Створюємо новий бренд
          const { error } = await supabase.from("brands").insert({
            ...brandData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: ${error.message}`)
          } else {
            created++
          }
        }
      } catch (error) {
        errors++
        errorMessages.push(`Рядок ${i + 1}: ${(error as Error).message}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorMessages,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Помилка імпорту: " + (error as Error).message }, { status: 500 })
  }
}
