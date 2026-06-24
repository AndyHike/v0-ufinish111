import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateCatalog } from "@/lib/revalidate-catalog"

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
    const supabase = await createClient()

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []
    const touchedBrandIds = new Set<string>()

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
            touchedBrandIds.add(row.existingId)
          }
        } else {
          // Створюємо новий бренд
          const { data: inserted, error } = await supabase
            .from("brands")
            .insert({
              ...brandData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single()

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: ${error.message}`)
          } else {
            created++
            if (inserted?.id) touchedBrandIds.add(inserted.id)
          }
        }
      } catch (error) {
        errors++
        errorMessages.push(`Рядок ${i + 1}: ${(error as Error).message}`)
      }
    }

    if (touchedBrandIds.size > 0) {
      try {
        await revalidateCatalog(supabase, { brandIds: touchedBrandIds })
      } catch (revalidateError) {
        console.error("[import-export/brands] revalidate error:", revalidateError)
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
