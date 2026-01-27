import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

async function findOrCreate(supabase: any, table: string, data: any, uniqueFields: string[]): Promise<any> {
  const query = supabase.from(table).select("*")

  for (const field of uniqueFields) {
    if (data[field]) {
      query.eq(field, data[field])
    }
  }

  const { data: existing } = await query.maybeSingle()

  if (existing) {
    return existing
  }

  const { data: created, error } = await supabase
    .from(table)
    .insert({
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error(`Error creating ${table}:`, error)
    return null
  }

  return created
}

export async function POST(request: NextRequest) {
  try {
    const { data, createMissing } = await request.json()
    const supabase = createClient()

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []

    for (let i = 0; i < (data?.length || 0); i++) {
      const row = data[i]

      try {
        let brandId = row.brandId
        let seriesId = row.seriesId
        let modelId = row.modelId

        // Створюємо відсутні бренди, серії, моделі якщо потрібно
        if (createMissing) {
          if (!brandId && row.brandName) {
            const brand = await findOrCreate(
              supabase,
              "brands",
              {
                name: row.brandName,
                slug: createSlug(row.brandName),
              },
              ["name"],
            )
            brandId = brand?.id
          }

          if (!seriesId && row.seriesName && brandId) {
            const series = await findOrCreate(
              supabase,
              "series",
              {
                name: row.seriesName,
                slug: createSlug(row.seriesName),
                brand_id: brandId,
              },
              ["name", "brand_id"],
            )
            seriesId = series?.id
          }

          if (!modelId && row.modelName && brandId && seriesId) {
            const model = await findOrCreate(
              supabase,
              "models",
              {
                name: row.modelName,
                slug: createSlug(row.modelName),
                brand_id: brandId,
                series_id: seriesId,
              },
              ["name", "brand_id", "series_id"],
            )
            modelId = model?.id
          }
        }

        if (!modelId || !row.serviceId) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Відсутня ${!modelId ? "модель" : "послуга"}`)
          continue
        }

        const price =
          Number.parseFloat(
            row.price
              ?.toString()
              .replace(/[^\d,.-]/g, "")
              .replace(",", "."),
          ) || 0

        // Parse warranty period (can be number or text like "6 міс.")
        let warrantyMonths = 0
        if (row.warrantyPeriod) {
          const warrantyStr = row.warrantyPeriod.toString().toLowerCase()
          const warrantyNum = Number.parseInt(warrantyStr.replace(/[^\d]/g, ""))
          if (!Number.isNaN(warrantyNum)) {
            warrantyMonths = warrantyNum
          }
        }

        // Parse duration in minutes and convert to hours
        const durationMinutes = Number.parseInt(row.duration?.toString().replace(/[^\d]/g, "") || "0")
        const durationHours = Math.round((durationMinutes / 60) * 100) / 100

        // Check if service exists
        const { data: existing } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", row.serviceId)
          .eq("model_id", modelId)
          .maybeSingle()

        const serviceData = {
          service_id: row.serviceId,
          model_id: modelId,
          price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: row.serviceName,
          benefits: row.warranty || null,
        }

        if (existing) {
          const { error } = await supabase.from("model_services").update(serviceData).eq("id", existing.id)

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1} (оновлення): ${error.message}`)
          } else {
            updated++
          }
        } else {
          const { error } = await supabase.from("model_services").insert({
            ...serviceData,
            created_at: new Date().toISOString(),
          })

          if (error) {
            errors++
            errorMessages.push(`Рядок ${i + 1} (вставка): ${error.message}`)
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
      errorMessages: errorMessages.slice(0, 10),
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Помилка імпорту: " + (error as Error).message }, { status: 500 })
  }
}
