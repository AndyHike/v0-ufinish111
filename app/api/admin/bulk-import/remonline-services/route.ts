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

    for (let i = 0; i < services.length; i++) {
      const service = services[i]

      try {
        const slug = createSlug(service.description)

        const warrantyMonths = service.warranty
          ? convertToWarrantyMonths(service.warranty, service.warranty_period || "months")
          : null

        const durationHours = service.duration_minutes ? convertToHours(service.duration_minutes.toString()) : null

        const { data: existingService } = await supabase.from("services").select("id, slug").eq("slug", slug).single()

        const serviceData = {
          slug,
          name: service.description,
          description: service.detailed_description || service.description,
          price: service.standard_price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          what_included: service.what_included || "",
          benefits: service.benefits || "",
          category: service.category,
          updated_at: new Date().toISOString(),
        }

        if (existingService) {
          const { error: updateError } = await supabase
            .from("services")
            .update(serviceData)
            .eq("id", existingService.id)

          if (updateError) {
            errors.push(`Рядок ${i + 1}: Помилка оновлення - ${updateError.message}`)
          } else {
            updateCount++
            successCount++
          }
        } else {
          const { error: insertError } = await supabase.from("services").insert({
            ...serviceData,
            created_at: new Date().toISOString(),
          })

          if (insertError) {
            errors.push(`Рядок ${i + 1}: Помилка створення - ${insertError.message}`)
          } else {
            createCount++
            successCount++
          }
        }

        processedServices.push({
          ...service,
          slug,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          status: existingService ? "updated" : "created",
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
        brands_found: 0, // Поки що не обробляємо бренди
        series_found: 0, // Поки що не обробляємо серії
        models_found: 0, // Поки що не обробляємо моделі
        new_models_needed: 0,
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
