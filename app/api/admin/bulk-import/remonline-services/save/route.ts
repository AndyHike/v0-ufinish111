import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

type ServiceToSave = {
  service_id: string
  brand_id: string
  series_id: string | null
  model_id: string | null
  model_name: string | null // For creating new models
  price: number | null
  warranty_duration: number | null
  warranty_period: "months" | "days" | null
  duration_minutes: number | null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function POST(request: Request) {
  try {
    const { services } = await request.json()

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: "Services array is required" }, { status: 400 })
    }

    const supabase = createClient()
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const service of services as ServiceToSave[]) {
      try {
        let modelId = service.model_id

        // Create new model if needed
        if (!modelId && service.model_name && service.brand_id) {
          const modelSlug = generateSlug(service.model_name)

          // Get the highest position for this brand
          const { data: existingModels } = await supabase
            .from("models")
            .select("position")
            .eq("brand_id", service.brand_id)
            .order("position", { ascending: false })
            .limit(1)

          const nextPosition = existingModels && existingModels.length > 0 ? existingModels[0].position + 1 : 1

          const { data: newModel, error: modelError } = await supabase
            .from("models")
            .insert({
              name: service.model_name,
              slug: modelSlug,
              brand_id: service.brand_id,
              series_id: service.series_id,
              position: nextPosition,
            })
            .select("id")
            .single()

          if (modelError) {
            console.error("Error creating model:", modelError)
            errors.push(`Failed to create model "${service.model_name}": ${modelError.message}`)
            errorCount++
            continue
          }

          modelId = newModel.id
        }

        if (!modelId) {
          errors.push("Model ID is required")
          errorCount++
          continue
        }

        // Check if model_service already exists
        const { data: existingModelService } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", modelId)
          .eq("service_id", service.service_id)
          .single()

        const modelServiceData = {
          model_id: modelId,
          service_id: service.service_id,
          price: service.price,
          warranty_duration: service.warranty_duration,
          warranty_period: service.warranty_period,
          duration_minutes: service.duration_minutes,
        }

        if (existingModelService) {
          // Update existing
          const { error: updateError } = await supabase
            .from("model_services")
            .update(modelServiceData)
            .eq("id", existingModelService.id)

          if (updateError) {
            console.error("Error updating model service:", updateError)
            errors.push(`Failed to update service: ${updateError.message}`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          // Create new
          const { error: insertError } = await supabase.from("model_services").insert(modelServiceData)

          if (insertError) {
            console.error("Error creating model service:", insertError)
            errors.push(`Failed to create service: ${insertError.message}`)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (error) {
        console.error("Error processing service:", error)
        errors.push(`Failed to process service: ${error instanceof Error ? error.message : String(error)}`)
        errorCount++
      }
    }

    return NextResponse.json({
      success: successCount,
      errors: errorCount,
      details: errors,
    })
  } catch (error) {
    console.error("Error saving services:", error)
    return NextResponse.json(
      { error: "Failed to save services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
