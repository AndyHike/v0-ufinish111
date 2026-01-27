import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function createSlug(text: string): string {
  if (!text || typeof text !== "string") return ""
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

async function findOrCreateBrand(supabase: any, brandName: string) {
  if (!brandName) return null

  const { data: existingBrand } = await supabase
    .from("brands")
    .select("id, name, slug")
    .eq("name", brandName)
    .maybeSingle()

  if (existingBrand) {
    return existingBrand
  }

  const slug = createSlug(brandName)
  const { data: newBrand, error } = await supabase
    .from("brands")
    .insert({
      name: brandName,
      slug: slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, slug")
    .single()

  if (error) {
    console.error("Error creating brand:", error)
    return null
  }

  return newBrand
}

async function findOrCreateSeries(supabase: any, seriesName: string, brandId: string) {
  if (!seriesName || !brandId) return null

  const { data: existingSeries } = await supabase
    .from("series")
    .select("id, name, slug, brand_id")
    .eq("name", seriesName)
    .eq("brand_id", brandId)
    .maybeSingle()

  if (existingSeries) {
    return existingSeries
  }

  const slug = createSlug(seriesName)
  const { data: newSeries, error } = await supabase
    .from("series")
    .insert({
      name: seriesName,
      slug: slug,
      brand_id: brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, slug, brand_id")
    .single()

  if (error) {
    console.error("Error creating series:", error)
    return null
  }

  return newSeries
}

async function findOrCreateModel(supabase: any, modelName: string, brandId: string, seriesId: string) {
  if (!modelName || !brandId || !seriesId) return null

  const { data: existingModel } = await supabase
    .from("models")
    .select("id, name, slug, brand_id, series_id")
    .eq("name", modelName)
    .eq("brand_id", brandId)
    .eq("series_id", seriesId)
    .maybeSingle()

  if (existingModel) {
    return existingModel
  }

  const slug = createSlug(modelName)
  const { data: newModel, error } = await supabase
    .from("models")
    .insert({
      name: modelName,
      slug: slug,
      brand_id: brandId,
      series_id: seriesId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, slug, brand_id, series_id")
    .single()

  if (error) {
    console.error("Error creating model:", error)
    return null
  }

  return newModel
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    const supabase = createClient()

    let created = 0
    let updated = 0
    let errors = 0
    let skipped = 0
    let brandsCreated = 0
    let seriesCreated = 0
    let modelsCreated = 0
    const errorMessages: string[] = []
    const warnings: string[] = []

    console.log(`Starting import of ${data.length} services...`)

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        if (row.status === "error" || !row.serviceId) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Пропущено через критичні помилки валідації`)
          continue
        }

        // Перевіряємо чи користувач вибрав створювати відсутні елементи
        const shouldCreateMissing = row.createMissing === true

        // Якщо є відсутні елементи і користувач вибрав їх пропустити
        if (
          !shouldCreateMissing &&
          (row.missingBrand || row.missingSeries || row.missingModel)
        ) {
          skipped++
          const missingParts = []
          if (row.missingBrand) missingParts.push(`бренд "${row.brandName}"`)
          if (row.missingSeries) missingParts.push(`серія "${row.seriesName}"`)
          if (row.missingModel) missingParts.push(`модель "${row.modelName}"`)
          warnings.push(`Рядок ${i + 1}: Пропущено - немає ${missingParts.join(", ")}`)
          continue
        }

        let finalModelId = row.modelId

        // Створюємо відсутні елементи якщо це потрібно
        if (!finalModelId && shouldCreateMissing && row.brandName && row.seriesName && row.modelName) {
          console.log(`Creating hierarchy for row ${i + 1}: ${row.brandName} > ${row.seriesName} > ${row.modelName}`)

          const brand = await findOrCreateBrand(supabase, row.brandName)
          if (!brand) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: Не вдалося створити бренд "${row.brandName}"`)
            continue
          }
          if (!row.brandId) {
            brandsCreated++
            warnings.push(`Рядок ${i + 1}: Створено новий бренд "${row.brandName}"`)
          }

          const series = await findOrCreateSeries(supabase, row.seriesName, brand.id)
          if (!series) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: Не вдалося створити серію "${row.seriesName}"`)
            continue
          }
          if (!row.seriesId) {
            seriesCreated++
            warnings.push(`Рядок ${i + 1}: Створено нову серію "${row.seriesName}"`)
          }

          const model = await findOrCreateModel(supabase, row.modelName, brand.id, series.id)
          if (!model) {
            errors++
            errorMessages.push(`Рядок ${i + 1}: Не вдалося створити модель "${row.modelName}"`)
            continue
          }
          if (!row.modelId) {
            modelsCreated++
            warnings.push(`Рядок ${i + 1}: Створено нову модель "${row.modelName}"`)
          }

          finalModelId = model.id
          console.log(
            `Created/found hierarchy for row ${i + 1}: Brand(${brand.id}), Series(${series.id}), Model(${model.id})`,
          )
        }

        if (!finalModelId) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Відсутня модель для прив'язки послуги`)
          continue
        }

        let price = 0
        if (row.price && row.price.toString().trim() !== "") {
          const parsedPrice = Number.parseFloat(
            row.price
              .toString()
              .replace(/[^\d,.-]/g, "")
              .replace(",", "."),
          )
          if (!isNaN(parsedPrice) && parsedPrice >= 0) {
            price = parsedPrice
          }
        }

        let warrantyMonths = 0
        if (row.warrantyPeriod) {
          const warrantyStr = row.warrantyPeriod.toString().toLowerCase()
          const warrantyNum = Number.parseInt(warrantyStr.replace(/[^\d]/g, ""))

          if (warrantyStr.includes("рік") || warrantyStr.includes("year")) {
            warrantyMonths = warrantyNum * 12
          } else if (warrantyStr.includes("місяц") || warrantyStr.includes("month")) {
            warrantyMonths = warrantyNum
          } else if (warrantyStr.includes("день") || warrantyStr.includes("day")) {
            warrantyMonths = Math.ceil(warrantyNum / 30)
          } else {
            warrantyMonths = warrantyNum
          }
        }

        let durationHours = 0
        if (row.duration) {
          const durationMinutes = Number.parseInt(row.duration.toString().replace(/[^\d]/g, ""))
          if (!isNaN(durationMinutes)) {
            durationHours = Math.round((durationMinutes / 60) * 100) / 100
          }
        }

        const { data: existingService, error: checkError } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", row.serviceId)
          .eq("model_id", finalModelId)
          .maybeSingle()

        if (checkError) {
          console.error(`Error checking existing service for row ${i + 1}:`, checkError)
          errors++
          errorMessages.push(`Рядок ${i + 1}: Помилка перевірки існуючої послуги`)
          continue
        }

        const serviceData = {
          service_id: row.serviceId,
          model_id: finalModelId,
          price: price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: row.description,
          benefits: row.warranty || null,
          what_included: null,
        }

        if (existingService) {
          const { error: updateError } = await supabase
            .from("model_services")
            .update(serviceData)
            .eq("id", existingService.id)

          if (updateError) {
            console.error(`Error updating service for row ${i + 1}:`, updateError)
            errors++
            errorMessages.push(`Рядок ${i + 1}: Помилка оновлення послуги`)
          } else {
            updated++
            console.log(`Updated service for row ${i + 1}`)
          }
        } else {
          const { error: insertError } = await supabase.from("model_services").insert({
            ...serviceData,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error(`Error creating service for row ${i + 1}:`, insertError)
            errors++
            errorMessages.push(`Рядок ${i + 1}: Помилка створення послуги`)
          } else {
            created++
            console.log(`Created service for row ${i + 1}`)
          }
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        errors++
        errorMessages.push(`Рядок ${i + 1}: ${(error as Error).message}`)
      }
    }

    console.log(`Import completed: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`)
    console.log(`Hierarchy created: ${brandsCreated} brands, ${seriesCreated} series, ${modelsCreated} models`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      errors,
      brandsCreated,
      seriesCreated,
      modelsCreated,
      errorMessages: errorMessages.slice(0, 10),
      warnings: warnings.slice(0, 10),
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Помилка імпорту: " + (error as Error).message }, { status: 500 })
  }
}
