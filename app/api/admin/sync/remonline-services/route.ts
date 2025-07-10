import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import remonline from "@/lib/api/remonline"

// Helper function to create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// Helper function to parse barcode
function parseBarcode(barcode: string) {
  if (!barcode) return null

  const parts = barcode.split("-")
  if (parts.length < 2) return null

  // Expected format: service-brand-series-model or variations
  return {
    service: parts[0] || null,
    brand: parts[1] || null,
    series: parts[2] || null,
    model: parts[3] || null,
  }
}

// Helper function to find or create brand
async function findOrCreateBrand(supabase: any, brandName: string, sessionId: string) {
  if (!brandName) return null

  const brandSlug = createSlug(brandName)

  // Try to find existing brand
  const { data: existingBrand } = await supabase.from("brands").select("id").eq("slug", brandSlug).single()

  if (existingBrand) {
    return existingBrand.id
  }

  // Create new brand
  const { data: newBrand, error } = await supabase
    .from("brands")
    .insert({
      name: brandName,
      slug: brandSlug,
      position: 999,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating brand:", error)
    return null
  }

  // Update session stats
  await supabase.rpc("increment_sync_session_brands", { session_id: sessionId })

  return newBrand.id
}

// Helper function to find or create series
async function findOrCreateSeries(supabase: any, seriesName: string, brandId: string, sessionId: string) {
  if (!seriesName || !brandId) return null

  const seriesSlug = createSlug(seriesName)

  // Try to find existing series
  const { data: existingSeries } = await supabase
    .from("series")
    .select("id")
    .eq("slug", seriesSlug)
    .eq("brand_id", brandId)
    .single()

  if (existingSeries) {
    return existingSeries.id
  }

  // Create new series
  const { data: newSeries, error } = await supabase
    .from("series")
    .insert({
      name: seriesName,
      slug: seriesSlug,
      brand_id: brandId,
      position: 999,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating series:", error)
    return null
  }

  // Update session stats
  await supabase.rpc("increment_sync_session_series", { session_id: sessionId })

  return newSeries.id
}

// Helper function to find or create model
async function findOrCreateModel(supabase: any, modelName: string, seriesId: string, sessionId: string) {
  if (!modelName || !seriesId) return null

  const modelSlug = createSlug(modelName)

  // Try to find existing model
  const { data: existingModel } = await supabase
    .from("models")
    .select("id")
    .eq("slug", modelSlug)
    .eq("series_id", seriesId)
    .single()

  if (existingModel) {
    return existingModel.id
  }

  // Create new model
  const { data: newModel, error } = await supabase
    .from("models")
    .insert({
      name: modelName,
      slug: modelSlug,
      series_id: seriesId,
      position: 999,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating model:", error)
    return null
  }

  // Update session stats
  await supabase.rpc("increment_sync_session_models", { session_id: sessionId })

  return newModel.id
}

// Helper function to find or create service
async function findOrCreateService(supabase: any, serviceName: string, serviceSlug: string, remService: any) {
  if (!serviceName || !serviceSlug) return null

  // Try to find existing service
  const { data: existingService } = await supabase.from("services").select("id").eq("slug", serviceSlug).single()

  if (existingService) {
    return existingService.id
  }

  // Create new service
  const { data: newService, error } = await supabase
    .from("services")
    .insert({
      slug: serviceSlug,
      name: serviceName,
      position: 999,
      warranty_months: remService.warranty || 6,
      duration_hours: Math.round((remService.duration_hours || 120) / 60),
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating service:", error)
    return null
  }

  // Create translation
  await supabase.from("services_translations").insert({
    service_id: newService.id,
    locale: "uk",
    name: serviceName,
    description: remService.description || "",
  })

  return newService.id
}

// Helper function to update session progress
async function updateSessionProgress(supabase: any, sessionId: string, updates: any) {
  await supabase
    .from("remonline_sync_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { categoryIds, syncAll = false } = body

    // Generate unique session ID
    const sessionId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("🔄 Starting RemOnline services sync with session:", sessionId)

    // Test API connection first
    const connectionTest = await remonline.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to RemOnline API",
          details: connectionTest.message,
        },
        { status: 500 },
      )
    }

    const supabase = createClient()

    // Create sync session
    await supabase.from("remonline_sync_sessions").insert({
      session_id: sessionId,
      status: "running",
      started_at: new Date().toISOString(),
    })

    // Get target category IDs
    let targetCategoryIds: number[] = []
    if (!syncAll && categoryIds && categoryIds.length > 0) {
      targetCategoryIds = categoryIds
    }

    // Fetch services from RemOnline
    console.log("📥 Fetching services from RemOnline...")
    const servicesResult = await remonline.getAllServices(targetCategoryIds.length > 0 ? targetCategoryIds : undefined)

    if (!servicesResult.success) {
      await updateSessionProgress(supabase, sessionId, {
        status: "error",
        error_message: servicesResult.message,
        completed_at: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch services from RemOnline",
          details: servicesResult.message,
          sessionId,
        },
        { status: 500 },
      )
    }

    const remOnlineServices = servicesResult.services || []

    // Update session with total count
    await updateSessionProgress(supabase, sessionId, {
      total_services: remOnlineServices.length,
    })

    console.log(`📊 Processing ${remOnlineServices.length} services...`)

    // Process services in batches to provide real-time updates
    const batchSize = 10
    let processed = 0
    let created = 0
    let updated = 0
    let errors = 0

    for (let i = 0; i < remOnlineServices.length; i += batchSize) {
      const batch = remOnlineServices.slice(i, i + batchSize)

      for (const remService of batch) {
        try {
          processed++

          // Update current service in session
          await updateSessionProgress(supabase, sessionId, {
            processed_services: processed,
            current_service_title: remService.title,
          })

          // Parse barcode
          const barcode = remService.barcodes?.[0]?.code || ""
          const parsedBarcode = parseBarcode(barcode)

          // Extract price
          const priceValues = Object.values(remService.prices || {})
          const price = priceValues.length > 0 ? Number(priceValues[0]) || 0 : 0

          // Ensure cost is a valid number
          const cost = Number(remService.cost) || 0

          let brandId = null
          let seriesId = null
          let modelId = null
          let serviceId = null

          // Process hierarchy if barcode is parseable
          if (parsedBarcode) {
            // Create/find brand
            if (parsedBarcode.brand) {
              brandId = await findOrCreateBrand(supabase, parsedBarcode.brand, sessionId)

              // Create/find series
              if (parsedBarcode.series && brandId) {
                seriesId = await findOrCreateSeries(supabase, parsedBarcode.series, brandId, sessionId)

                // Create/find model
                if (parsedBarcode.model && seriesId) {
                  modelId = await findOrCreateModel(supabase, parsedBarcode.model, seriesId, sessionId)
                }
              }
            }

            // Create/find service
            if (parsedBarcode.service) {
              serviceId = await findOrCreateService(supabase, remService.title, parsedBarcode.service, remService)
            }
          }

          // Check if RemOnline service already exists
          const { data: existingRemService } = await supabase
            .from("remonline_services")
            .select("*")
            .eq("remonline_id", remService.id)
            .single()

          const serviceData = {
            remonline_id: remService.id,
            service_id: serviceId,
            brand_id: brandId,
            series_id: seriesId,
            model_id: modelId,
            title: remService.title,
            cost: cost,
            price: price,
            duration_minutes: remService.duration_hours || 0,
            warranty_months: remService.warranty || 0,
            barcode: barcode,
            category_id: remService.category?.id || null,
            parsed_service_slug: parsedBarcode?.service || null,
            parsed_brand_slug: parsedBarcode?.brand || null,
            parsed_series_slug: parsedBarcode?.series || null,
            parsed_model_slug: parsedBarcode?.model || null,
            sync_status: "completed",
            sync_error: null,
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
              errors++

              // Update with error status
              await supabase
                .from("remonline_services")
                .update({
                  sync_status: "error",
                  sync_error: updateError.message,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingRemService.id)
            } else {
              updated++
            }
          } else {
            // Create new
            const { error: insertError } = await supabase.from("remonline_services").insert(serviceData)

            if (insertError) {
              console.error(`Error creating RemOnline service ${remService.id}:`, insertError)
              errors++

              // Try to insert with error status
              await supabase.from("remonline_services").insert({
                ...serviceData,
                sync_status: "error",
                sync_error: insertError.message,
              })
            } else {
              created++
            }
          }

          // Update session progress
          await updateSessionProgress(supabase, sessionId, {
            processed_services: processed,
            created_services: created,
            updated_services: updated,
            error_services: errors,
          })
        } catch (error) {
          console.error(`Error processing service ${remService.id}:`, error)
          errors++

          await updateSessionProgress(supabase, sessionId, {
            processed_services: processed,
            error_services: errors,
          })
        }
      }

      // Small delay between batches to allow real-time updates
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Complete session
    await updateSessionProgress(supabase, sessionId, {
      status: "completed",
      completed_at: new Date().toISOString(),
      current_service_title: null,
    })

    console.log("✅ RemOnline services sync completed")

    return NextResponse.json({
      success: true,
      sessionId,
      processed,
      created,
      updated,
      errors,
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
