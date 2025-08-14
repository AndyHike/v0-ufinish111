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

async function findOrCreateBrand(supabase: any, brandName: string, selectedBrandId?: string) {
  if (selectedBrandId) {
    const { data: selectedBrand, error } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", selectedBrandId)
      .maybeSingle()

    if (error) throw new Error(`Помилка отримання вибраного бренду: ${error.message}`)
    if (selectedBrand) return { ...selectedBrand, isNew: false }
  }

  const { data: existingBrand, error: findError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("name", brandName)
    .maybeSingle()

  if (findError) {
    console.error("Error finding brand:", findError)
    throw new Error(`Помилка пошуку бренду: ${findError.message}`)
  }

  if (existingBrand) {
    return { ...existingBrand, isNew: false }
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
  return { ...newBrand, isNew: true }
}

async function findOrCreateSeries(supabase: any, seriesName: string, brandId: number, selectedSeriesId?: string) {
  if (selectedSeriesId) {
    const { data: selectedSeries, error } = await supabase
      .from("series")
      .select("id, name")
      .eq("id", selectedSeriesId)
      .eq("brand_id", brandId)
      .maybeSingle()

    if (error) throw new Error(`Помилка отримання вибраної серії: ${error.message}`)
    if (selectedSeries) return { ...selectedSeries, isNew: false }
  }

  const { data: existingSeries, error: findError } = await supabase
    .from("series")
    .select("id, name")
    .eq("name", seriesName)
    .eq("brand_id", brandId)
    .maybeSingle()

  if (findError) {
    console.error("Error finding series:", findError)
    throw new Error(`Помилка пошуку лінійки: ${findError.message}`)
  }

  if (existingSeries) {
    return { ...existingSeries, isNew: false }
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
  return { ...newSeries, isNew: true }
}

async function findOrCreateModel(
  supabase: any,
  modelName: string,
  seriesId: number,
  brandId: number,
  selectedModelId?: string,
) {
  if (selectedModelId) {
    const { data: selectedModel, error } = await supabase
      .from("models")
      .select("id, name, created_at")
      .eq("id", selectedModelId)
      .maybeSingle()

    if (error) throw new Error(`Помилка отримання вибраної моделі: ${error.message}`)
    if (selectedModel) return { ...selectedModel, isNew: false }
  }

  const { data: existingModel, error: findError } = await supabase
    .from("models")
    .select("id, name, created_at")
    .eq("name", modelName)
    .eq("series_id", seriesId)
    .maybeSingle()

  if (findError) {
    console.error("Error finding model:", findError)
    throw new Error(`Помилка пошуку моделі: ${findError.message}`)
  }

  if (existingModel) {
    return { ...existingModel, isNew: false }
  }

  const { data: newModel, error } = await supabase
    .from("models")
    .insert({
      name: modelName,
      slug: createSlug(modelName),
      series_id: seriesId,
      brand_id: brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, created_at")
    .single()

  if (error) throw new Error(`Помилка створення моделі: ${error.message}`)
  return { ...newModel, isNew: true }
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
    let newBrandsCreated = 0
    let newSeriesCreated = 0
    let newModelsCreated = 0

    for (let i = 0; i < services.length; i++) {
      const service = services[i]

      try {
        console.log(`Processing service ${i + 1}/${services.length}: ${service.description}`)

        let brand, series, model, baseService

        if (
          service.selected_brand_id &&
          service.selected_series_id &&
          service.selected_model_id &&
          service.selected_service_id
        ) {
          // Використовуємо вибрані ID
          const { data: selectedBrand } = await supabase
            .from("brands")
            .select("id, name")
            .eq("id", service.selected_brand_id)
            .single()

          const { data: selectedSeries } = await supabase
            .from("series")
            .select("id, name")
            .eq("id", service.selected_series_id)
            .single()

          const { data: selectedModel } = await supabase
            .from("models")
            .select("id, name, created_at")
            .eq("id", service.selected_model_id)
            .single()

          const { data: selectedService } = await supabase
            .from("services")
            .select("id, slug")
            .eq("id", service.selected_service_id)
            .single()

          brand = { ...selectedBrand, isNew: false }
          series = { ...selectedSeries, isNew: false }
          model = { ...selectedModel, isNew: false }
          baseService = selectedService

          brandsFound++
          seriesFound++
          modelsFound++
        } else {
          // Парсимо категорію як раніше
          const categoryInfo = parseCategoryPath(service.category)
          if (!categoryInfo) {
            errors.push(
              `Рядок ${i + 1}: Неправильний формат категорії "${service.category}". Очікується: Бренд > Лінійка > Модель`,
            )
            continue
          }

          brand = await findOrCreateBrand(supabase, categoryInfo.brand, service.selected_brand_id)
          if (brand.isNew) newBrandsCreated++
          brandsFound++

          series = await findOrCreateSeries(supabase, categoryInfo.series, brand.id, service.selected_series_id)
          if (series.isNew) newSeriesCreated++
          seriesFound++

          model = await findOrCreateModel(supabase, categoryInfo.model, series.id, brand.id, service.selected_model_id)
          if (model.isNew) newModelsCreated++
          modelsFound++

          // Знаходимо базову послугу
          const slug = createSlug(service.description)
          const { data: foundService, error: serviceError } = await supabase
            .from("services")
            .select("id, slug")
            .eq("slug", slug)
            .maybeSingle()

          if (serviceError) {
            console.error("Error finding base service:", serviceError)
            errors.push(`Рядок ${i + 1}: Помилка пошуку базової послуги - ${serviceError.message}`)
            continue
          }

          if (!foundService) {
            errors.push(`Рядок ${i + 1}: Базова послуга з slug "${slug}" не знайдена в таблиці services`)
            continue
          }

          baseService = foundService
        }

        const warrantyMonths = service.warranty
          ? convertToWarrantyMonths(service.warranty, service.warranty_period || "months")
          : null

        const durationHours = service.duration_minutes ? convertToHours(service.duration_minutes.toString()) : null

        const { data: existingModelService, error: modelServiceError } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", baseService.id)
          .eq("model_id", model.id)
          .maybeSingle()

        if (modelServiceError) {
          console.error("Error finding model service:", modelServiceError)
          errors.push(`Рядок ${i + 1}: Помилка пошуку послуги моделі - ${modelServiceError.message}`)
          continue
        }

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
            console.error("Error updating model service:", updateError)
            errors.push(`Рядок ${i + 1}: Помилка оновлення model_services - ${updateError.message}`)
          } else {
            updateCount++
            successCount++
            console.log(`Updated model service for ${service.description}`)
          }
        } else {
          const { error: insertError } = await supabase.from("model_services").insert({
            ...modelServiceData,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Error creating model service:", insertError)
            errors.push(`Рядок ${i + 1}: Помилка створення model_services - ${insertError.message}`)
          } else {
            createCount++
            successCount++
            console.log(`Created model service for ${service.description}`)
          }
        }

        processedServices.push({
          ...service,
          slug: baseService.slug,
          brand: brand.name,
          series: series.name,
          model: model.name,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          status: existingModelService ? "updated" : "created",
        })
      } catch (error) {
        console.error(`Error processing service ${i + 1}:`, error)
        errors.push(`Рядок ${i + 1}: ${error instanceof Error ? error.message : "Невідома помилка"}`)
      }
    }

    console.log(`Import completed: ${successCount}/${services.length} processed, ${errors.length} errors`)

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
        new_brands_created: newBrandsCreated,
        new_series_created: newSeriesCreated,
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
