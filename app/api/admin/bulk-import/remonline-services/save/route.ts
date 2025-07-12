import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { services } = await request.json()

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: "Invalid services data" }, { status: 400 })
    }

    console.log(`Starting import of ${services.length} services`)

    const results = {
      success: 0,
      errors: 0,
      details: [] as any[],
    }

    for (const service of services) {
      try {
        console.log(`Processing: ${service.brand_name} ${service.model_name} - ${service.service_name}`)

        // 1. Find or create brand
        let { data: brand, error: brandError } = await supabase
          .from("brands")
          .select("id")
          .eq("name", service.brand_name)
          .maybeSingle()

        if (brandError) {
          console.error("Brand lookup error:", brandError)
          throw new Error(`Brand lookup failed: ${brandError.message}`)
        }

        if (!brand) {
          console.log(`Creating new brand: ${service.brand_name}`)
          const { data: newBrand, error: createBrandError } = await supabase
            .from("brands")
            .insert({
              name: service.brand_name,
              slug: service.brand_name.toLowerCase().replace(/\s+/g, "-"),
              position: 999,
            })
            .select("id")
            .single()

          if (createBrandError) {
            console.error("Brand creation error:", createBrandError)
            throw new Error(`Failed to create brand: ${createBrandError.message}`)
          }

          brand = newBrand
        }

        // 2. Find or create series (if provided)
        let seriesId = null
        if (service.series_name && service.series_name.trim()) {
          let { data: series, error: seriesError } = await supabase
            .from("series")
            .select("id")
            .eq("name", service.series_name)
            .eq("brand_id", brand.id)
            .maybeSingle()

          if (seriesError) {
            console.error("Series lookup error:", seriesError)
            throw new Error(`Series lookup failed: ${seriesError.message}`)
          }

          if (!series) {
            console.log(`Creating new series: ${service.series_name}`)
            const { data: newSeries, error: createSeriesError } = await supabase
              .from("series")
              .insert({
                name: service.series_name,
                slug: service.series_name.toLowerCase().replace(/\s+/g, "-"),
                brand_id: brand.id,
                position: 999,
              })
              .select("id")
              .single()

            if (createSeriesError) {
              console.error("Series creation error:", createSeriesError)
              throw new Error(`Failed to create series: ${createSeriesError.message}`)
            }

            series = newSeries
          }

          seriesId = series.id
        }

        // 3. Find or create model
        let { data: model, error: modelError } = await supabase
          .from("models")
          .select("id")
          .eq("name", service.model_name)
          .eq("brand_id", brand.id)
          .maybeSingle()

        if (modelError) {
          console.error("Model lookup error:", modelError)
          throw new Error(`Model lookup failed: ${modelError.message}`)
        }

        if (!model) {
          console.log(`Creating new model: ${service.model_name}`)
          const { data: newModel, error: createModelError } = await supabase
            .from("models")
            .insert({
              name: service.model_name,
              slug: service.model_name.toLowerCase().replace(/\s+/g, "-"),
              brand_id: brand.id,
              series_id: seriesId,
              position: 999,
            })
            .select("id")
            .single()

          if (createModelError) {
            console.error("Model creation error:", createModelError)
            throw new Error(`Failed to create model: ${createModelError.message}`)
          }

          model = newModel
        }

        // 4. Find service by name
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("id")
          .eq("slug", service.service_name.toLowerCase().replace(/\s+/g, "-"))
          .maybeSingle()

        if (serviceError) {
          console.error("Service lookup error:", serviceError)
          throw new Error(`Service lookup failed: ${serviceError.message}`)
        }

        if (!serviceData) {
          console.error(`Service not found: ${service.service_name}`)
          throw new Error(`Service not found: ${service.service_name}`)
        }

        // 5. Create or update model service using the same logic as model-services API
        const { data: existingModelService, error: existingError } = await supabase
          .from("model_services")
          .select("id")
          .eq("model_id", model.id)
          .eq("service_id", serviceData.id)
          .maybeSingle()

        if (existingError) {
          console.error("Existing model service lookup error:", existingError)
          throw new Error(`Model service lookup failed: ${existingError.message}`)
        }

        const modelServiceData = {
          model_id: model.id,
          service_id: serviceData.id,
          price: service.price,
          warranty_months: service.warranty_months,
          duration_hours: service.duration_hours,
          warranty_period: service.warranty_period,
          detailed_description: service.detailed_description,
          what_included: service.what_included,
          benefits: service.benefits,
        }

        if (existingModelService) {
          // Update existing model service
          console.log(`Updating existing model service for ${service.model_name} - ${service.service_name}`)
          const { error: updateError } = await supabase
            .from("model_services")
            .update(modelServiceData)
            .eq("id", existingModelService.id)

          if (updateError) {
            console.error("Model service update error:", updateError)
            throw new Error(`Failed to update model service: ${updateError.message}`)
          }
        } else {
          // Create new model service
          console.log(`Creating new model service for ${service.model_name} - ${service.service_name}`)
          const { error: insertError } = await supabase.from("model_services").insert(modelServiceData)

          if (insertError) {
            console.error("Model service creation error:", insertError)
            throw new Error(`Failed to create model service: ${insertError.message}`)
          }
        }

        results.success++
        results.details.push({
          status: "success",
          service: `${service.brand_name} ${service.model_name} - ${service.service_name}`,
          action: existingModelService ? "updated" : "created",
        })

        console.log(`✅ Successfully processed: ${service.brand_name} ${service.model_name} - ${service.service_name}`)
      } catch (error) {
        console.error(`❌ Error processing service:`, error)
        results.errors++
        results.details.push({
          status: "error",
          service: `${service.brand_name} ${service.model_name} - ${service.service_name}`,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`Import completed: ${results.success} success, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Bulk import error:", error)
    return NextResponse.json({ error: "Failed to import services" }, { status: 500 })
  }
}
