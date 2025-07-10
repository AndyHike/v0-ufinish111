import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import remonline from "@/lib/api/remonline"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { categoryIds, syncAll = false } = body

    console.log("🔄 Starting RemOnline services sync...")
    console.log("📋 Category IDs:", categoryIds)
    console.log("📋 Sync all:", syncAll)

    // Test API connection first
    const connectionTest = await remonline.testConnection()
    if (!connectionTest.success) {
      console.error("RemOnline API connection test failed:", connectionTest.message)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to RemOnline API",
          details: connectionTest.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ RemOnline API connection successful")

    const supabase = createClient()

    // Get category associations if not syncing all
    let targetCategoryIds: number[] = []
    if (!syncAll && categoryIds && categoryIds.length > 0) {
      targetCategoryIds = categoryIds
    }

    // Fetch services from RemOnline
    console.log("📥 Fetching services from RemOnline...")
    const servicesResult = await remonline.getAllServices(targetCategoryIds.length > 0 ? targetCategoryIds : undefined)

    if (!servicesResult.success) {
      console.error("Failed to fetch services from RemOnline:", servicesResult.message)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch services from RemOnline",
          details: servicesResult.message,
        },
        { status: 500 },
      )
    }

    const remOnlineServices = servicesResult.services || []
    console.log(`📊 Fetched ${remOnlineServices.length} services from RemOnline`)

    // Get category associations for mapping
    const { data: categoryAssociations } = await supabase.from("remonline_categories").select("*")

    const categoryMap = new Map(categoryAssociations?.map((cat) => [cat.category_id, cat]) || [])

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    }

    // Process each service
    for (const remService of remOnlineServices) {
      try {
        results.processed++

        // Parse barcode for service mapping
        const barcode = remService.barcodes?.[0]?.code || ""
        const barcodeparts = barcode.split("-")

        // Extract price (first price from prices object)
        const priceValues = Object.values(remService.prices || {})
        const price = priceValues.length > 0 ? priceValues[0] : 0

        // Check if RemOnline service already exists
        const { data: existingRemService } = await supabase
          .from("remonline_services")
          .select("*")
          .eq("remonline_id", remService.id)
          .single()

        const serviceData = {
          remonline_id: remService.id,
          title: remService.title,
          cost: remService.cost || 0,
          price: price,
          duration_minutes: remService.duration_hours || 0,
          warranty_months: remService.warranty || 0,
          barcode: barcode,
          category_id: remService.category?.id || null,
          last_synced_at: new Date().toISOString(),
        }

        if (existingRemService) {
          // Update existing
          const { error: updateError } = await supabase
            .from("remonline_services")
            .update({
              ...serviceData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingRemService.id)

          if (updateError) {
            console.error(`Error updating RemOnline service ${remService.id}:`, updateError)
            results.errors++
            results.details.push({
              remonline_id: remService.id,
              title: remService.title,
              status: "error",
              error: updateError.message,
            })
          } else {
            results.updated++
            results.details.push({
              remonline_id: remService.id,
              title: remService.title,
              status: "updated",
            })
          }
        } else {
          // Create new
          const { error: insertError } = await supabase.from("remonline_services").insert(serviceData)

          if (insertError) {
            console.error(`Error creating RemOnline service ${remService.id}:`, insertError)
            results.errors++
            results.details.push({
              remonline_id: remService.id,
              title: remService.title,
              status: "error",
              error: insertError.message,
            })
          } else {
            results.created++
            results.details.push({
              remonline_id: remService.id,
              title: remService.title,
              status: "created",
            })
          }
        }

        // Try to match and create/update local service if barcode matches pattern
        if (barcode && barcodeparts.length >= 2) {
          const serviceSlug = barcodeparts[0]
          const brandSlug = barcodeparts[1]

          // Find matching brand
          const { data: brand } = await supabase.from("brands").select("id").eq("slug", brandSlug).single()

          if (brand) {
            // Check if local service exists
            const { data: existingService } = await supabase
              .from("services")
              .select("id")
              .eq("slug", serviceSlug)
              .single()

            if (!existingService) {
              // Create local service
              const { data: newService, error: serviceError } = await supabase
                .from("services")
                .insert({
                  slug: serviceSlug,
                  name: remService.title,
                  position: 999,
                  warranty_months: remService.warranty || 0,
                  duration_hours: Math.round((remService.duration_hours || 0) / 60),
                })
                .select()
                .single()

              if (!serviceError && newService) {
                // Create translation
                await supabase.from("services_translations").insert({
                  service_id: newService.id,
                  locale: "uk",
                  name: remService.title,
                  description: remService.description || "",
                })

                // Update RemOnline service with local service ID
                await supabase
                  .from("remonline_services")
                  .update({ service_id: newService.id })
                  .eq("remonline_id", remService.id)
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing service ${remService.id}:`, error)
        results.errors++
        results.details.push({
          remonline_id: remService.id,
          title: remService.title,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    console.log("✅ RemOnline services sync completed")
    console.log("📊 Results:", results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error("Error syncing RemOnline services:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync RemOnline services",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
