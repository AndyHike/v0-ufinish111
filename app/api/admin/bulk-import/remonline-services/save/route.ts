import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: rawData, locale = "uk" } = await request.json()

    if (!rawData || !Array.isArray(rawData)) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }

    console.log(`Starting import of ${rawData.length} records for locale ${locale}`)

    const results = {
      success: 0,
      errors: 0,
      details: [] as any[],
    }

    // Process each record
    for (const [index, item] of rawData.entries()) {
      try {
        console.log(`Processing record ${index + 1}/${rawData.length}:`, {
          model: item.model_name,
          service: item.service_name,
        })

        // Step 1: Find or create brand
        let brand = null
        if (item.brand_name) {
          const brandSlug = generateSlug(item.brand_name)
          const { data: existingBrand } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle()

          if (existingBrand) {
            brand = existingBrand
            console.log(`Found existing brand: ${item.brand_name}`)
          } else {
            // Get max position for new brand
            const { data: maxPositionData } = await supabase
              .from("brands")
              .select("position")
              .order("position", { ascending: false })
              .limit(1)

            const maxPosition = maxPositionData?.[0]?.position || 0

            const { data: newBrand, error: brandError } = await supabase
              .from("brands")
              .insert({
                name: item.brand_name,
                slug: brandSlug,
                position: maxPosition + 1,
              })
              .select("id")
              .single()

            if (brandError) {
              console.error(`Error creating brand ${item.brand_name}:`, brandError)
              throw brandError
            }

            brand = newBrand
            console.log(`Created new brand: ${item.brand_name}`)
          }
        }

        // Step 2: Find or create series
        let series = null
        if (item.series_name && brand) {
          const seriesSlug = generateSlug(item.series_name)
          const { data: existingSeries } = await supabase
            .from("series")
            .select("id")
            .eq("slug", seriesSlug)
            .eq("brand_id", brand.id)
            .maybeSingle()

          if (existingSeries) {
            series = existingSeries
            console.log(`Found existing series: ${item.series_name}`)
          } else {
            // Get max position for new series
            const { data: maxPositionData } = await supabase
              .from("series")
              .select("position")
              .eq("brand_id", brand.id)
              .order("position", { ascending: false })
              .limit(1)

            const maxPosition = maxPositionData?.[0]?.position || 0

            const { data: newSeries, error: seriesError } = await supabase
              .from("series")
              .insert({
                name: item.series_name,
                slug: seriesSlug,
                brand_id: brand.id,
                position: maxPosition + 1,
              })
              .select("id")
              .single()

            if (seriesError) {
              console.error(`Error creating series ${item.series_name}:`, seriesError)
              throw seriesError
            }

            series = newSeries
            console.log(`Created new series: ${item.series_name}`)
          }
        }

        // Step 3: Find or create model
        const modelSlug = generateSlug(item.model_name)
        const { data: existingModel } = await supabase.from("models").select("id").eq("slug", modelSlug).maybeSingle()

        let model = null
        if (existingModel) {
          model = existingModel
          console.log(`Found existing model: ${item.model_name}`)
        } else {
          // Get max position for new model
          const { data: maxPositionData } = await supabase
            .from("models")
            .select("position")
            .order("position", { ascending: false })
            .limit(1)

          const maxPosition = maxPositionData?.[0]?.position || 0

          const { data: newModel, error: modelError } = await supabase
            .from("models")
            .insert({
              name: item.model_name,
              slug: modelSlug,
              brand_id: brand?.id || null,
              series_id: series?.id || null,
              position: maxPosition + 1,
            })
            .select("id")
            .single()

          if (modelError) {
            console.error(`Error creating model ${item.model_name}:`, modelError)
            throw modelError
          }

          model = newModel
          console.log(`Created new model: ${item.model_name}`)
        }

        // Step 4: Find or create service
        const serviceSlug = generateSlug(item.service_name)
        const { data: existingService } = await supabase
          .from("services")
          .select("id")
          .eq("slug", serviceSlug)
          .maybeSingle()

        let service = null
        if (existingService) {
          service = existingService
          console.log(`Found existing service: ${item.service_name}`)
        } else {
          // Get max position for new service
          const { data: maxPositionData } = await supabase
            .from("services")
            .select("position")
            .order("position", { ascending: false })
            .limit(1)

          const maxPosition = maxPositionData?.[0]?.position || 0

          const { data: newService, error: serviceError } = await supabase
            .from("services")
            .insert({
              slug: serviceSlug,
              position: maxPosition + 1,
              warranty_months: item.warranty_months || 3, // Default values for service template
              duration_hours: item.duration_hours || 1,
            })
            .select("id")
            .single()

          if (serviceError) {
            console.error(`Error creating service ${item.service_name}:`, serviceError)
            throw serviceError
          }

          service = newService
          console.log(`Created new service: ${item.service_name}`)

          // Create service translation
          const { error: translationError } = await supabase.from("services_translations").insert({
            service_id: service.id,
            locale,
            name: item.service_name,
            description: item.service_description || "",
            detailed_description: item.detailed_description || null,
            what_included: item.what_included || null,
            benefits: item.benefits || null,
          })

          if (translationError) {
            console.error(`Error creating service translation:`, translationError)
            throw translationError
          }

          console.log(`Created service translation for locale ${locale}`)
        }

        // Step 5: Create or update model service with all new fields
        const { data: existingModelService } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .maybeSingle()

        const modelServiceData = {
          model_id: model.id,
          service_id: service.id,
          price: item.price,
          warranty_months: item.warranty_months,
          duration_hours: item.duration_hours,
          warranty_period: item.warranty_period || "months",
          detailed_description: item.detailed_description || null,
          what_included: item.what_included || null,
          benefits: item.benefits || null,
        }

        if (existingModelService) {
          // Update existing model service
          const { error: updateError } = await supabase
            .from("model_services")
            .update(modelServiceData)
            .eq("id", existingModelService.id)

          if (updateError) {
            console.error(`Error updating model service:`, updateError)
            throw updateError
          }

          console.log(`Updated existing model service`)
        } else {
          // Create new model service
          const { error: insertError } = await supabase.from("model_services").insert(modelServiceData)

          if (insertError) {
            console.error(`Error creating model service:`, insertError)
            throw insertError
          }

          console.log(`Created new model service`)
        }

        results.success++
        results.details.push({
          row: item.original_row,
          status: "success",
          model: item.model_name,
          service: item.service_name,
        })

        console.log(`Successfully processed record ${index + 1}`)
      } catch (error) {
        console.error(`Error processing record ${index + 1}:`, error)
        results.errors++
        results.details.push({
          row: item.original_row,
          status: "error",
          model: item.model_name,
          service: item.service_name,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`Import completed. Success: ${results.success}, Errors: ${results.errors}`)

    return NextResponse.json({
      success: true,
      message: `Import completed. ${results.success} records processed successfully, ${results.errors} errors.`,
      results,
    })
  } catch (error) {
    console.error("Error saving imported data:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
