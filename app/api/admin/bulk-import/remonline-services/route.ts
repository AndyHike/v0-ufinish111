import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Видаляємо спеціальні символи
    .replace(/\s+/g, "-") // Замінюємо пробіли на дефіси
    .replace(/-+/g, "-") // Замінюємо множинні дефіси на один
    .trim()
}

function convertToWarrantyMonths(duration: string, period: string): number | null {
  const durationNum = Number.parseFloat(duration.replace(",", "."))
  if (isNaN(durationNum)) return null

  switch (period?.toLowerCase()) {
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

function convertToHours(minutes: string): number | null {
  const minutesNum = Number.parseFloat(minutes.replace(",", "."))
  if (isNaN(minutesNum)) return null
  return Math.round((minutesNum / 60) * 100) / 100
}

function parseCategoryPath(category: string): { brand: string; series: string; model: string } | null {
  if (!category) return null

  const parts = category.split(">").map((part) => part.trim())
  if (parts.length !== 3) return null

  return {
    brand: parts[0],
    series: parts[1],
    model: parts[2],
  }
}

async function findOrCreateBrand(supabase: any, brandName: string) {
  const { data: existingBrand } = await supabase.from("brands").select("id, name").eq("name", brandName).single()

  if (existingBrand) {
    return existingBrand
  }

  const { data: newBrand, error } = await supabase
    .from("brands")
    .insert({
      name: brandName,
      slug: createSlug(brandName),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name")
    .single()

  if (error) throw new Error(`Помилка створення бренду: ${error.message}`)
  return newBrand
}

async function findOrCreateSeries(supabase: any, seriesName: string, brandId: number) {
  const { data: existingSeries } = await supabase
    .from("series")
    .select("id, name")
    .eq("name", seriesName)
    .eq("brand_id", brandId)
    .single()

  if (existingSeries) {
    return existingSeries
  }

  const { data: newSeries, error } = await supabase
    .from("series")
    .insert({
      name: seriesName,
      slug: createSlug(seriesName),
      brand_id: brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name")
    .single()

  if (error) throw new Error(`Помилка створення лінійки: ${error.message}`)
  return newSeries
}

async function findOrCreateModel(supabase: any, modelName: string, seriesId: number) {
  const { data: existingModel } = await supabase
    .from("models")
    .select("id, name")
    .eq("name", modelName)
    .eq("series_id", seriesId)
    .single()

  if (existingModel) {
    return existingModel
  }

  const { data: newModel, error } = await supabase
    .from("models")
    .insert({
      name: modelName,
      slug: createSlug(modelName),
      series_id: seriesId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name")
    .single()

  if (error) throw new Error(`Помилка створення моделі: ${error.message}`)
  return newModel
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { services } = await request.json()

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: "No services data provided" }, { status: 400 })
    }

    const processedServices = []
    const errors = []
    let successCount = 0
    let updateCount = 0
    let createCount = 0
    let brandsFound = 0
    let seriesFound = 0
    let modelsFound = 0
    let newModelsCreated = 0

    for (let i = 0; i < services.length; i++) {
      const service = services[i]

      try {
        const categoryInfo = parseCategoryPath(service.category)
        if (!categoryInfo) {
          errors.push(
            `Рядок ${i + 1}: Неправильний формат категорії "${service.category}". Очікується: Бренд > Лінійка > Модель`,
          )
          continue
        }

        const brand = await findOrCreateBrand(supabase, categoryInfo.brand)
        brandsFound++

        const series = await findOrCreateSeries(supabase, categoryInfo.series, brand.id)
        seriesFound++

        const model = await findOrCreateModel(supabase, categoryInfo.model, series.id)
        modelsFound++
        if (!model.created_at || new Date(model.created_at).getTime() > Date.now() - 1000) {
          newModelsCreated++
        }

        const slug = createSlug(service.description)
        const { data: baseService } = await supabase.from("services").select("id, slug").eq("slug", slug).single()

        if (!baseService) {
          errors.push(`Рядок ${i + 1}: Базова послуга з slug "${slug}" не знайдена в таблиці services`)
          continue
        }

        const warrantyMonths = service.warranty
          ? convertToWarrantyMonths(service.warranty, service.warranty_period || "months")
          : null

        const durationHours = service.duration_minutes ? convertToHours(service.duration_minutes.toString()) : null

        const { data: existingModelService } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", baseService.id)
          .eq("model_id", model.id)
          .single()

        const modelServiceData = {
          service_id: baseService.id,
          model_id: model.id,
          price: service.standard_price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: service.detailed_description || service.description,
          what_included: service.what_included || "",
          benefits: service.benefits || "",
          updated_at: new Date().toISOString(),
        }

        if (existingModelService) {
          const { error: updateError } = await supabase
            .from("model_services")
            .update(modelServiceData)
            .eq("id", existingModelService.id)

          if (updateError) {
            errors.push(`Рядок ${i + 1}: Помилка оновлення model_services - ${updateError.message}`)
          } else {
            updateCount++
            successCount++
          }
        } else {
          const { error: insertError } = await supabase.from("model_services").insert({
            ...modelServiceData,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            errors.push(`Рядок ${i + 1}: Помилка створення model_services - ${insertError.message}`)
          } else {
            createCount++
            successCount++
          }
        }

        processedServices.push({
          ...service,
          slug,
          brand: categoryInfo.brand,
          series: categoryInfo.series,
          model: categoryInfo.model,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          status: existingModelService ? "updated" : "created",
        })
      } catch (error) {
        errors.push(`Рядок ${i + 1}: ${error instanceof Error ? error.message : "Невідома помилка"}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: services.length,
      processed: successCount,
      created: createCount,
      updated: updateCount,
      errors: errors.length,
      errorDetails: errors,
      services: processedServices,
      summary: {
        total: services.length,
        with_errors: errors.length,
        services_found: successCount,
        brands_found: brandsFound,
        series_found: seriesFound,
        models_found: modelsFound,
        new_models_needed: newModelsCreated,
      },
    })
  } catch (error) {
    console.error("Error processing services:", error)
    return NextResponse.json(
      {
        error: "Failed to process services",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
