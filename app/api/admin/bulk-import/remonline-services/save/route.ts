import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

type ServiceToSave = {
  service_id: string
  brand_id: string
  series_id: string | null
  model_id: string
  price: number | null
  warranty_duration: number | null
  warranty_period: "months" | "days" | null
  duration_minutes: number | null
}

export async function POST(request: Request) {
  try {
    const { services } = await request.json()

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json({ error: "Services array is required" }, { status: 400 })
    }

    const supabase = createClient()
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const service of services as ServiceToSave[]) {
      try {
        // Validate required fields
        if (!service.service_id || !service.brand_id || !service.model_id) {
          result.failed++
          result.errors.push("Missing required fields: service_id, brand_id, model_id")
          continue
        }

        // Convert warranty to months if needed
        let warrantyMonths = service.warranty_duration
        if (service.warranty_period === "days" && service.warranty_duration) {
          warrantyMonths = Math.round(service.warranty_duration / 30)
        }

        // Convert duration to hours
        const durationHours = service.duration_minutes ? service.duration_minutes / 60 : null

        // Check if model service already exists
        const { data: existingService } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", service.model_id)
          .eq("service_id", service.service_id)
          .maybeSingle()

        if (existingService) {
          // Update existing
          const { error: updateError } = await supabase
            .from("model_services")
            .update({
              price: service.price,
              warranty_months: warrantyMonths,
              duration_hours: durationHours,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingService.id)

          if (updateError) {
            result.failed++
            result.errors.push(`Failed to update service: ${updateError.message}`)
            continue
          }
        } else {
          // Create new
          const { error: createError } = await supabase.from("model_services").insert({
            model_id: service.model_id,
            service_id: service.service_id,
            price: service.price,
            warranty_months: warrantyMonths,
            duration_hours: durationHours,
          })

          if (createError) {
            result.failed++
            result.errors.push(`Failed to create service: ${createError.message}`)
            continue
          }
        }

        result.success++
      } catch (err) {
        result.failed++
        result.errors.push(`Error processing service: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error saving services:", error)
    return NextResponse.json(
      { error: "Failed to save services", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
