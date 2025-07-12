import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: importData } = await request.json()

    if (!importData || !Array.isArray(importData)) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    console.log(`[IMPORT] Starting import of ${importData.length} items`)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string }>,
    }

    for (const item of importData) {
      try {
        console.log(
          `[IMPORT] Processing row ${item.rowIndex}: ${item.brand_name} ${item.model_name} - ${item.service_name}`,
        )

        // 1. Знаходимо або створюємо бренд
        let { data: brand, error: brandError } = await supabase
          .from("brands")
          .select("id")
          .eq("name", item.brand_name)
          .maybeSingle()

        if (brandError) {
          console.error(`[IMPORT] Error finding brand:`, brandError)
          results.failed++
          results.errors.push({ row: item.rowIndex, error: `Brand error: ${brandError.message}` })
          continue
        }

        if (!brand) {
          console.log(`[IMPORT] Creating new brand: ${item.brand_name}`)
          const { data: newBrand, error: createBrandError } = await supabase
            .from("brands")
            .insert({ name: item.brand_name, slug: item.brand_name.toLowerCase().replace(/\s+/g, "-") })
            .select("id")
            .single()

          if (createBrandError) {
            console.error(`[IMPORT] Error creating brand:`, createBrandError)
            results.failed++
            results.errors.push({ row: item.rowIndex, error: `Failed to create brand: ${createBrandError.message}` })
            continue
          }
          brand = newBrand
        }

        // 2. Знаходимо або створюємо модель
        let { data: model, error: modelError } = await supabase
          .from("models")
          .select("id")
          .eq("name", item.model_name)
          .eq("brand_id", brand.id)
          .maybeSingle()

        if (modelError) {
          console.error(`[IMPORT] Error finding model:`, modelError)
          results.failed++
          results.errors.push({ row: item.rowIndex, error: `Model error: ${modelError.message}` })
          continue
        }

        if (!model) {
          console.log(`[IMPORT] Creating new model: ${item.model_name}`)

          // Отримуємо наступну позицію для моделі
          const { data: maxPositionData } = await supabase
            .from("models")
            .select("position")
            .eq("brand_id", brand.id)
            .order("position", { ascending: false })
            .limit(1)

          const nextPosition = (maxPositionData?.[0]?.position || 0) + 1

          const { data: newModel, error: createModelError } = await supabase
            .from("models")
            .insert({
              name: item.model_name,
              slug: `${item.brand_name}-${item.model_name}`.toLowerCase().replace(/\s+/g, "-"),
              brand_id: brand.id,
              position: nextPosition,
            })
            .select("id")
            .single()

          if (createModelError) {
            console.error(`[IMPORT] Error creating model:`, createModelError)
            results.failed++
            results.errors.push({ row: item.rowIndex, error: `Failed to create model: ${createModelError.message}` })
            continue
          }
          model = newModel
        }

        // 3. Знаходимо або створюємо послугу
        let { data: service, error: serviceError } = await supabase
          .from("services")
          .select("id")
          .eq("services_translations.name", item.service_name)
          .eq("services_translations.locale", "uk")
          .maybeSingle()

        if (serviceError) {
          console.error(`[IMPORT] Error finding service:`, serviceError)
          results.failed++
          results.errors.push({ row: item.rowIndex, error: `Service error: ${serviceError.message}` })
          continue
        }

        if (!service) {
          console.log(`[IMPORT] Creating new service: ${item.service_name}`)

          // Отримуємо наступну позицію для послуги
          const { data: maxServicePositionData } = await supabase
            .from("services")
            .select("position")
            .order("position", { ascending: false })
            .limit(1)

          const nextServicePosition = (maxServicePositionData?.[0]?.position || 0) + 1

          const { data: newService, error: createServiceError } = await supabase
            .from("services")
            .insert({
              slug: item.service_name.toLowerCase().replace(/\s+/g, "-"),
              position: nextServicePosition,
            })
            .select("id")
            .single()

          if (createServiceError) {
            console.error(`[IMPORT] Error creating service:`, createServiceError)
            results.failed++
            results.errors.push({
              row: item.rowIndex,
              error: `Failed to create service: ${createServiceError.message}`,
            })
            continue
          }

          // Створюємо переклад для послуги
          const { error: translationError } = await supabase.from("services_translations").insert({
            service_id: newService.id,
            locale: "uk",
            name: item.service_name,
            description: item.service_name,
          })

          if (translationError) {
            console.error(`[IMPORT] Error creating service translation:`, translationError)
            results.failed++
            results.errors.push({
              row: item.rowIndex,
              error: `Failed to create service translation: ${translationError.message}`,
            })
            continue
          }

          service = newService
        }

        // 4. Створюємо або оновлюємо model_service
        const { data: existingModelService, error: existingError } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .maybeSingle()

        if (existingError) {
          console.error(`[IMPORT] Error checking existing model service:`, existingError)
          results.failed++
          results.errors.push({
            row: item.rowIndex,
            error: `Error checking existing model service: ${existingError.message}`,
          })
          continue
        }

        const modelServiceData = {
          model_id: model.id,
          service_id: service.id,
          price: item.price,
          warranty_months: item.warranty_months,
          duration_hours: item.duration_hours,
          warranty_period: item.warranty_period,
          detailed_description: item.detailed_description,
          what_included: item.what_included,
          benefits: item.benefits,
        }

        if (existingModelService) {
          console.log(`[IMPORT] Updating existing model service`)
          const { error: updateError } = await supabase
            .from("model_services")
            .update(modelServiceData)
            .eq("id", existingModelService.id)

          if (updateError) {
            console.error(`[IMPORT] Error updating model service:`, updateError)
            results.failed++
            results.errors.push({ row: item.rowIndex, error: `Failed to update model service: ${updateError.message}` })
            continue
          }
        } else {
          console.log(`[IMPORT] Creating new model service`)
          const { error: insertError } = await supabase.from("model_services").insert(modelServiceData)

          if (insertError) {
            console.error(`[IMPORT] Error creating model service:`, insertError)
            results.failed++
            results.errors.push({ row: item.rowIndex, error: `Failed to create model service: ${insertError.message}` })
            continue
          }
        }

        console.log(`[IMPORT] Successfully processed row ${item.rowIndex}`)
        results.success++
      } catch (error) {
        console.error(`[IMPORT] Unexpected error processing row ${item.rowIndex}:`, error)
        results.failed++
        results.errors.push({
          row: item.rowIndex,
          error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    console.log(`[IMPORT] Import completed. Success: ${results.success}, Failed: ${results.failed}`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("[IMPORT] Error in bulk import:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
