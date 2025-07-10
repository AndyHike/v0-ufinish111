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

// Helper function to parse barcode with flexible service slug detection
function parseBarcode(barcode: string) {
  if (!barcode) return null

  const parts = barcode.split("-")
  if (parts.length < 2) return null

  // Try different combinations for service slug
  // Could be 1, 2, or 3 words for service
  const possibleServiceSlugs = []

  // 1 word service: "screen-apple-iphone-13-pro"
  if (parts.length >= 4) {
    possibleServiceSlugs.push({
      service: parts[0],
      brand: parts[1],
      series: parts[2],
      model: parts.slice(3).join("-"),
    })
  }

  // 2 word service: "screen-replacement-apple-iphone-13-pro"
  if (parts.length >= 5) {
    possibleServiceSlugs.push({
      service: parts.slice(0, 2).join("-"),
      brand: parts[2],
      series: parts[3],
      model: parts.slice(4).join("-"),
    })
  }

  // 3 word service: "screen-replacement-premium-apple-iphone-13-pro"
  if (parts.length >= 6) {
    possibleServiceSlugs.push({
      service: parts.slice(0, 3).join("-"),
      brand: parts[3],
      series: parts[4],
      model: parts.slice(5).join("-"),
    })
  }

  return possibleServiceSlugs
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
      phase: "fetching",
      status: "running",
      started_at: new Date().toISOString(),
    })

    // PHASE 1: Fetch all services from RemOnline
    console.log("📥 Phase 1: Fetching services from RemOnline...")
    await updateSessionProgress(supabase, sessionId, {
      phase: "fetching",
      current_service_title: "Отримання послуг з RemOnline API...",
    })

    let targetCategoryIds: number[] = []
    if (!syncAll && categoryIds && categoryIds.length > 0) {
      targetCategoryIds = categoryIds
    }

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

    await updateSessionProgress(supabase, sessionId, {
      total_services: remOnlineServices.length,
      fetched_services: remOnlineServices.length,
      phase: "parsing",
      current_service_title: "Аналіз штрихкодів та співставлення з базою...",
    })

    console.log(`📊 Fetched ${remOnlineServices.length} services, starting parsing phase...`)

    // Get existing services for slug matching
    const { data: existingServices } = await supabase.from("services").select("id, slug, name")
    const serviceSlugMap = new Map(existingServices?.map((s) => [s.slug, s]) || [])

    // Get existing brands, series, models for matching
    const { data: existingBrands } = await supabase.from("brands").select("id, slug, name")
    const { data: existingSeries } = await supabase.from("series").select("id, slug, name, brand_id")
    const { data: existingModels } = await supabase.from("models").select("id, slug, name, series_id")

    const brandSlugMap = new Map(existingBrands?.map((b) => [b.slug, b]) || [])
    const seriesSlugMap = new Map(existingSeries?.map((s) => [s.slug, s]) || [])
    const modelSlugMap = new Map(existingModels?.map((m) => [m.slug, m]) || [])

    // PHASE 2: Parse and analyze all services
    let parsed = 0
    const servicesToProcess = []

    for (const remService of remOnlineServices) {
      parsed++

      if (parsed % 50 === 0) {
        await updateSessionProgress(supabase, sessionId, {
          parsed_services: parsed,
          current_service_title: `Аналіз послуги: ${remService.title}`,
        })
      }

      const barcode = remService.barcodes?.[0]?.code || ""
      const possibleParsings = parseBarcode(barcode)

      let bestMatch = null
      let serviceFound = false
      let brandFound = false
      let seriesFound = false
      let modelFound = false

      // Try to find the best parsing that matches existing services
      if (possibleParsings) {
        for (const parsing of possibleParsings) {
          const serviceExists = serviceSlugMap.has(parsing.service)
          const brandExists = brandSlugMap.has(createSlug(parsing.brand))
          const seriesExists = seriesSlugMap.has(createSlug(parsing.series))
          const modelExists = modelSlugMap.has(createSlug(parsing.model))

          // Score this parsing (prefer existing matches)
          const score = (serviceExists ? 4 : 0) + (brandExists ? 2 : 0) + (seriesExists ? 1 : 0) + (modelExists ? 1 : 0)

          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              ...parsing,
              score,
              serviceExists,
              brandExists,
              seriesExists,
              modelExists,
            }
          }
        }
      }

      if (bestMatch) {
        serviceFound = bestMatch.serviceExists
        brandFound = bestMatch.brandExists
        seriesFound = bestMatch.seriesExists
        modelFound = bestMatch.modelExists
      }

      // Extract price
      const priceValues = Object.values(remService.prices || {})
      const price = priceValues.length > 0 ? Number(priceValues[0]) || 0 : 0
      const cost = Number(remService.cost) || 0

      const serviceData = {
        remonline_id: remService.id,
        title: remService.title,
        cost: cost,
        price: price,
        duration_minutes: remService.duration_hours || 0,
        warranty_months: remService.warranty || 0,
        barcode: barcode,
        category_id: remService.category?.id || null,
        parsed_service_slug: bestMatch?.service || null,
        parsed_brand_slug: bestMatch?.brand || null,
        parsed_series_slug: bestMatch?.series || null,
        parsed_model_slug: bestMatch?.model || null,
        service_slug_found: serviceFound,
        brand_slug_found: brandFound,
        series_slug_found: seriesFound,
        model_slug_found: modelFound,
        needs_review: !serviceFound || !bestMatch, // Needs review if service not found or no parsing
        sync_status: "parsed",
        last_synced_at: new Date().toISOString(),
      }

      servicesToProcess.push(serviceData)
    }

    await updateSessionProgress(supabase, sessionId, {
      parsed_services: parsed,
      phase: "processing",
      current_service_title: "Збереження проаналізованих послуг...",
    })

    // PHASE 3: Save all parsed services to database
    console.log("💾 Phase 3: Saving parsed services to database...")

    let processed = 0
    let created = 0
    let updated = 0
    let errors = 0
    let needsReview = 0

    for (const serviceData of servicesToProcess) {
      try {
        processed++

        if (processed % 20 === 0) {
          await updateSessionProgress(supabase, sessionId, {
            processed_services: processed,
            current_service_title: `Збереження: ${serviceData.title}`,
          })
        }

        // Check if RemOnline service already exists
        const { data: existingRemService } = await supabase
          .from("remonline_services")
          .select("*")
          .eq("remonline_id", serviceData.remonline_id)
          .single()

        if (serviceData.needs_review) {
          needsReview++
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
            console.error(`Error updating RemOnline service ${serviceData.remonline_id}:`, updateError)
            errors++
          } else {
            updated++
          }
        } else {
          // Create new
          const { error: insertError } = await supabase.from("remonline_services").insert(serviceData)

          if (insertError) {
            console.error(`Error creating RemOnline service ${serviceData.remonline_id}:`, insertError)
            errors++
          } else {
            created++
          }
        }
      } catch (error) {
        console.error(`Error processing service ${serviceData.remonline_id}:`, error)
        errors++
      }
    }

    // Complete session
    await updateSessionProgress(supabase, sessionId, {
      processed_services: processed,
      created_services: created,
      updated_services: updated,
      error_services: errors,
      services_needing_review: needsReview,
      phase: "completed",
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
      needsReview,
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
