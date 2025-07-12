import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

type ServiceToSave = {
  service_id: string
  brand_id: string
  series_id: string | null
  model_id: string | null
  model_name: string | null
  price: number | null
  warranty_duration: number | null
  warranty_period: "months" | "days" | null
  duration_minutes: number | null
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
          const { data: newModel, error: modelError } = await supabase
            .from("models")
            .insert({
              name: service.model_name,
              slug: service.model_name.toLowerCase().replace(/\s+/g, "-"),
              brand_id: service.brand_id,
              series_id: service.series_id,
            })
            .select("id")
            .single()

          if (modelError) {
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
        const { data: existingService } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", modelId)
          .eq("service_id", service.service_id)
          .single()

        if (existingService) {
          // Update existing service
          const { error: updateError } = await supabase
            .from("model_services")
            .update({
              price: service.price,
              warranty_duration: service.warranty_duration,
              warranty_period: service.warranty_period,
              duration_minutes: service.duration_minutes,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingService.id)

          if (updateError) {
            errors.push(`Failed to update service: ${updateError.message}`)
            errorCount++
          } else {
            successCount++
          }
        } else {
          // Create new service
          const { error: insertError } = await supabase.from("model_services").insert({
            model_id: modelId,
            service_id: service.service_id,
            price: service.price,
            warranty_duration: service.warranty_duration,
            warranty_period: service.warranty_period,
            duration_minutes: service.duration_minutes,
          })

          if (insertError) {
            errors.push(`Failed to create service: ${insertError.message}`)
            errorCount++
          } else {
            successCount++
          }
        }
      } catch (error) {
        errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
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
