import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

async function findOrCreateBrand(supabase: any, brandName: string): Promise<string | null> {
  const { data: existing } = await supabase.from("brands").select("id").eq("name", brandName).maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("brands")
    .insert({
      name: brandName,
      slug: createSlug(brandName),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) return null
  return created.id
}

async function findOrCreateSeries(supabase: any, seriesName: string, brandId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("series")
    .select("id")
    .eq("name", seriesName)
    .eq("brand_id", brandId)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("series")
    .insert({
      name: seriesName,
      slug: createSlug(seriesName),
      brand_id: brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) return null
  return created.id
}

export async function POST(request: NextRequest) {
  try {
    const { data, createMissing } = await request.json()
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

        let brandId = row.brandId
        let seriesId = row.seriesId

        if (createMissing) {
          if (!brandId && row.brandName) {
            brandId = await findOrCreateBrand(supabase, row.brandName)
          }

          if (!seriesId && row.seriesName && brandId) {
            seriesId = await findOrCreateSeries(supabase, row.seriesName, brandId)
          }
        }

        if (!brandId || !seriesId) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Відсутній бренд або серія`)
          continue
        }

        const modelData = {
          name: row.name,
          slug: row.slug || createSlug(row.name),
          brand_id: brandId,
          series_id: seriesId,
          position: row.position ? Number.parseInt(row.position) : null,
        }

        if (row.existingId) {
          const { error } = await supabase.from("models").update(modelData).eq("id", row.existingId)

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: ${error.message}`)
          } else {
            updated++
          }
        } else {
          const { error } = await supabase.from("models").insert({
            ...modelData,
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
