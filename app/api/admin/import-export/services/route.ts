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
  const supabase = await createClient()
  let created = 0
  let updated = 0
  let errors = 0
  const errorMessages: string[] = []

  try {
    const { data, createMissing } = await request.json()

    console.log("[v0] Supabase initialized:", !!supabase)

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        let brandId = row.brandId || null
        let seriesId = row.seriesId || null
        let modelId = row.modelId || null

        // Create missing brands, series, models if needed
        if (createMissing) {
          // Create brand if missing
          if (!brandId && row.brandName) {
            const { data: existingBrand } = await supabase
              .from("brands")
              .select("id")
              .eq("name", row.brandName)
              .maybeSingle()

            if (existingBrand) {
              brandId = existingBrand.id
            } else {
              const { data: newBrand, error: brandError } = await supabase
                .from("brands")
                .insert({
                  name: row.brandName,
                  slug: createSlug(row.brandName),
                })
                .select("id")
                .single()

              if (brandError) {
                throw new Error(`Brand creation error: ${brandError.message}`)
              }
              brandId = newBrand?.id
            }
          }

          // Create series if missing
          if (!seriesId && row.seriesName && brandId) {
            const { data: existingSeries } = await supabase
              .from("series")
              .select("id")
              .eq("name", row.seriesName)
              .eq("brand_id", brandId)
              .maybeSingle()

            if (existingSeries) {
              seriesId = existingSeries.id
            } else {
              const { data: newSeries, error: seriesError } = await supabase
                .from("series")
                .insert({
                  name: row.seriesName,
                  slug: createSlug(row.seriesName),
                  brand_id: brandId,
                })
                .select("id")
                .single()

              if (seriesError) {
                throw new Error(`Series creation error: ${seriesError.message}`)
              }
              seriesId = newSeries?.id
            }
          }

          // Create model if missing
          if (!modelId && row.modelName && brandId && seriesId) {
            const { data: existingModel } = await supabase
              .from("models")
              .select("id")
              .eq("name", row.modelName)
              .eq("series_id", seriesId)
              .maybeSingle()

            if (existingModel) {
              modelId = existingModel.id
            } else {
              const { data: newModel, error: modelError } = await supabase
                .from("models")
                .insert({
                  name: row.modelName,
                  slug: createSlug(row.modelName),
                  brand_id: brandId,
                  series_id: seriesId,
                })
                .select("id")
                .single()

              if (modelError) {
                throw new Error(`Model creation error: ${modelError.message}`)
              }
              modelId = newModel?.id
            }
          }
        }

        // Validate required fields
        if (!modelId || !row.serviceId) {
          errors++
          errorMessages.push(
            `Рядок ${i + 1}: Відсутня ${!modelId ? "модель" : "послуга"}`
          )
          continue
        }

        // Parse price
        const price =
          Number.parseFloat(
            row.price
              ?.toString()
              .replace(/[^\d,.-]/g, "")
              .replace(",", "."),
          ) || 0

        // Parse warranty period
        let warrantyMonths = 0
        if (row.warrantyPeriod) {
          const warrantyStr = row.warrantyPeriod.toString().toLowerCase()
          const warrantyNum = Number.parseInt(warrantyStr.replace(/[^\d]/g, ""))
          if (!Number.isNaN(warrantyNum)) {
            warrantyMonths = warrantyNum
          }
        }

        // Parse duration in minutes and convert to hours
        const durationMinutes = Number.parseInt(
          row.duration?.toString().replace(/[^\d]/g, "") || "0"
        )
        const durationHours = Math.round((durationMinutes / 60) * 100) / 100

        // Check if service exists
        const { data: existing, error: checkError } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", row.serviceId)
          .eq("model_id", modelId)
          .maybeSingle()

        if (checkError) {
          throw new Error(`Check error: ${checkError.message}`)
        }

        const serviceData = {
          service_id: row.serviceId,
          model_id: modelId,
          price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: row.serviceName || "",
          benefits: row.warranty || null,
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from("model_services")
            .update(serviceData)
            .eq("id", existing.id)

          if (updateError) {
            errors++
            errorMessages.push(
              `Рядок ${i + 1} (оновлення): ${updateError.message}`
            )
          } else {
            updated++
          }
        } else {
          const { error: insertError } = await supabase
            .from("model_services")
            .insert({
              ...serviceData,
              created_at: new Date().toISOString(),
            })

          if (insertError) {
            errors++
            errorMessages.push(
              `Рядок ${i + 1} (вставка): ${insertError.message}`
            )
          } else {
            created++
          }
        }
      } catch (error) {
        errors++
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        errorMessages.push(`Рядок ${i + 1}: ${errorMessage}`)
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Помилка імпорту: " + errorMessage },
      { status: 500 }
    )
  }
}
