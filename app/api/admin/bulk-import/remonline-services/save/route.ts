import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

type ServiceToSave = {
  service_id: string
  brand_id: string
  series_id: string | null
  model_id: string | null
  model_name: string | null
  price: number | null
  warranty_months: number | null
  warranty_period: "months" | "days" | null
  duration_hours: number | null
  detailed_description?: string | null
  what_included?: string | null
  benefits?: string | null
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
          console.log(`Created new model: ${service.model_name} with ID: ${modelId}`)
        }

        if (!modelId) {
          errors.push("Model ID is required")
          errorCount++
          continue
        }

        // Use the same logic as the model services management API
        // Check if the model service already exists
        console.log(`Checking if model service exists: modelId=${modelId}, serviceId=${service.service_id}`)
        const { data: existingData, error: existingError } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", modelId)
          .eq("service_id", service.service_id)
          .maybeSingle()

        if (existingError) {
          console.error(`Error checking existing model service:`, existingError)
          errors.push(`Failed to check existing model service: ${existingError.message}`)
          errorCount++
          continue
        }

        // Prepare service data with all new columns
        const serviceData = {
          price: service.price,
          warranty_months: service.warranty_months,
          duration_hours: service.duration_hours,
          warranty_period: service.warranty_period || "months",
          detailed_description: service.detailed_description,
          what_included: service.what_included,
          benefits: service.benefits,
        }

        let result

        if (existingData) {
          // Update existing record - same as in model-services API
          console.log(`Updating existing model service with ID ${existingData.id}`)
          const { data, error } = await supabase
            .from("model_services")
            .update(serviceData)
            .eq("id", existingData.id)
            .select()
            .single()

          if (error) {
            console.error("Error updating model service:", error)
            errors.push(`Failed to update model service: ${error.message}`)
            errorCount++
            continue
          }

          console.log("Successfully updated model service:", data)
          result = data
        } else {
          // Insert new record - same as in model-services API
          console.log("Creating new model service")
          const { data, error } = await supabase
            .from("model_services")
            .insert({
              model_id: modelId,
              service_id: service.service_id,
              ...serviceData,
            })
            .select()
            .single()

          if (error) {
            console.error("Error creating model service:", error)
            errors.push(`Failed to create model service: ${error.message}`)
            errorCount++
            continue
          }

          console.log("Successfully created model service:", data)
          result = data
        }

        successCount++
      } catch (error) {
        console.error("Error processing service:", error)
        errors.push(`Error processing service: ${error instanceof Error ? error.message : String(error)}`)
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
