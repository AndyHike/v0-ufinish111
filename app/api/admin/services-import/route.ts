import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()
    const supabase = createClient()

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []

    console.log(`Starting import of ${data.length} services...`)

    for (let i = 0; i < data.length; i++) {
      const row = data[i]

      try {
        // Skip invalid rows
        if (row.status === "error" || !row.serviceId || !row.modelId) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Пропущено через помилки валідації`)
          continue
        }

        // Parse price
        const price = Number.parseFloat(
          row.price
            .toString()
            .replace(/[^\d,.-]/g, "")
            .replace(",", "."),
        )
        if (isNaN(price) || price <= 0) {
          errors++
          errorMessages.push(`Рядок ${i + 1}: Некоректна ціна`)
          continue
        }

        // Parse warranty months
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
            warrantyMonths = warrantyNum // assume months
          }
        }

        // Parse duration hours
        let durationHours = 0
        if (row.duration) {
          const durationMinutes = Number.parseInt(row.duration.toString().replace(/[^\d]/g, ""))
          if (!isNaN(durationMinutes)) {
            durationHours = Math.round((durationMinutes / 60) * 100) / 100
          }
        }

        // Check if model service already exists
        const { data: existingService, error: checkError } = await supabase
          .from("model_services")
          .select("id")
          .eq("service_id", row.serviceId)
          .eq("model_id", row.modelId)
          .maybeSingle()

        if (checkError) {
          console.error(`Error checking existing service for row ${i + 1}:`, checkError)
          errors++
          errorMessages.push(`Рядок ${i + 1}: Помилка перевірки існуючої послуги`)
          continue
        }

        const serviceData = {
          service_id: row.serviceId,
          model_id: row.modelId,
          price: price,
          warranty_months: warrantyMonths,
          duration_hours: durationHours,
          detailed_description: row.description,
          benefits: row.warranty || null,
          what_included: null,
          updated_at: new Date().toISOString(),
        }

        if (existingService) {
          // Update existing service
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
          // Create new service
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

    console.log(`Import completed: ${created} created, ${updated} updated, ${errors} errors`)

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      errorMessages: errorMessages.slice(0, 10), // Limit error messages
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Помилка імпорту: " + (error as Error).message }, { status: 500 })
  }
}
