import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

type ServiceImportRow = {
  brand: string
  series?: string
  model: string
  service: string
  price: string | number
}

export async function POST(request: Request) {
  try {
    const { data } = await request.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const supabase = createClient()

    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each row
    for (const row of data) {
      try {
        // Validate row data
        if (!row.brand || !row.model || !row.service) {
          result.failed++
          result.errors.push(`Missing required fields for row: ${JSON.stringify(row)}`)
          continue
        }

        // 1. Find brand
        const { data: brand } = await supabase.from("brands").select("id").eq("name", row.brand).maybeSingle()

        if (!brand) {
          result.failed++
          result.errors.push(`Brand "${row.brand}" not found`)
          continue
        }

        // 2. Find series if provided
        let seriesId: string | null = null
        if (row.series && row.series.trim() !== "") {
          const { data: series } = await supabase
            .from("series")
            .select("id")
            .eq("name", row.series)
            .eq("brand_id", brand.id)
            .maybeSingle()

          if (series) {
            seriesId = series.id
          } else {
            result.failed++
            result.errors.push(`Series "${row.series}" not found for brand "${row.brand}"`)
            continue
          }
        }

        // 3. Find model
        const { data: model } = await supabase
          .from("models")
          .select("id")
          .eq("name", row.model)
          .eq("brand_id", brand.id)
          .maybeSingle()

        if (!model) {
          result.failed++
          result.errors.push(`Model "${row.model}" not found for brand "${row.brand}"`)
          continue
        }

        // 4. Find service
        const { data: service } = await supabase
          .from("services_translations")
          .select("service_id")
          .eq("name", row.service)
          .eq("locale", "uk") // Використовуємо українську локаль як основну
          .maybeSingle()

        if (!service) {
          // Створюємо новий сервіс, якщо він не існує
          const { data: newService, error: serviceError } = await supabase
            .from("services")
            .insert({})
            .select("id")
            .single()

          if (serviceError) {
            result.failed++
            result.errors.push(`Failed to create service "${row.service}": ${serviceError.message}`)
            continue
          }

          // Додаємо переклад для сервісу
          const { error: translationError } = await supabase.from("services_translations").insert({
            service_id: newService.id,
            name: row.service,
            description: "",
            locale: "uk",
          })

          if (translationError) {
            result.failed++
            result.errors.push(`Failed to create service translation "${row.service}": ${translationError.message}`)
            continue
          }

          // 5. Create model service
          const price =
            row.price === "" ? null : typeof row.price === "string" ? Number.parseFloat(row.price) : row.price

          const { error: modelServiceError } = await supabase.from("model_services").insert({
            model_id: model.id,
            service_id: newService.id,
            price,
          })

          if (modelServiceError) {
            result.failed++
            result.errors.push(
              `Failed to create model service for "${row.model}" - "${row.service}": ${modelServiceError.message}`,
            )
            continue
          }
        } else {
          // 5. Check if model service already exists
          const { data: modelService } = await supabase
            .from("model_services")
            .select("id")
            .eq("model_id", model.id)
            .eq("service_id", service.service_id)
            .maybeSingle()

          const price =
            row.price === "" ? null : typeof row.price === "string" ? Number.parseFloat(row.price) : row.price

          if (modelService) {
            // Update existing model service
            const { error: updateError } = await supabase
              .from("model_services")
              .update({ price })
              .eq("id", modelService.id)

            if (updateError) {
              result.failed++
              result.errors.push(
                `Failed to update model service for "${row.model}" - "${row.service}": ${updateError.message}`,
              )
              continue
            }
          } else {
            // Create new model service
            const { error: createError } = await supabase.from("model_services").insert({
              model_id: model.id,
              service_id: service.service_id,
              price,
            })

            if (createError) {
              result.failed++
              result.errors.push(
                `Failed to create model service for "${row.model}" - "${row.service}": ${createError.message}`,
              )
              continue
            }
          }
        }

        result.success++
      } catch (err) {
        result.failed++
        result.errors.push(
          `Error processing row: ${JSON.stringify(row)} - ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing bulk import:", error)
    return NextResponse.json(
      { error: "Failed to process import", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
