import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const modelId = searchParams.get("model_id")
    const locale = searchParams.get("locale") || "uk"
    const exportMode = searchParams.get("export") === "true"

    console.log(
      `[GET] /api/admin/model-services - Request params: modelId=${modelId}, locale=${locale}, export=${exportMode}`,
    )

    if (exportMode) {
      const supabase = createClient()

      const { data: modelServicesData, error } = await supabase
        .from("model_services")
        .select(`
          id,
          model_id,
          service_id,
          price,
          warranty_months,
          duration_hours,
          detailed_description,
          benefits,
          part_type
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[GET] /api/admin/model-services - Error fetching all model services:", error)
        return NextResponse.json({ error: "Failed to fetch model services", details: error }, { status: 500 })
      }

      return NextResponse.json({ services: modelServicesData })
    }

    if (!modelId) {
      console.error("[GET] /api/admin/model-services - Missing model_id parameter")
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    console.log(`[GET] /api/admin/model-services - Fetching services for locale ${locale}`)
    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select(`
        id, 
        slug,
        position,
        image_url,
        warranty_months,
        duration_hours,
        services_translations(
          name,
          description,
          locale
        )
      `)
      .order("position", { ascending: true })

    if (servicesError) {
      console.error("[GET] /api/admin/model-services - Error fetching services:", servicesError)
      return NextResponse.json({ error: "Failed to fetch services", details: servicesError }, { status: 500 })
    }

    console.log(`[GET] /api/admin/model-services - Found ${servicesData.length} services`)

    console.log(`[GET] /api/admin/model-services - Fetching model services for model ${modelId}`)
    const { data: modelServicesData, error: modelServicesError } = await supabase
      .from("model_services")
      .select(`
        id, 
        price, 
        model_id, 
        service_id,
        warranty_months,
        duration_hours,
        warranty_period,
        detailed_description,
        what_included,
        benefits,
        part_type
      `)
      .eq("model_id", modelId)

    if (modelServicesError) {
      console.error("[GET] /api/admin/model-services - Error fetching model services:", modelServicesError)
      return NextResponse.json(
        { error: "Failed to fetch model services", details: modelServicesError },
        { status: 500 },
      )
    }

    console.log(`[GET] /api/admin/model-services - Found ${modelServicesData.length} model services`)

    const servicesMap = new Map()
    servicesData.forEach((service) => {
      const translations = service.services_translations.filter((translation: any) => translation.locale === locale)

      servicesMap.set(service.id, {
        id: service.id,
        slug: service.slug,
        position: service.position,
        image_url: service.image_url,
        default_warranty_months: service.warranty_months,
        default_duration_hours: service.duration_hours,
        name: translations[0]?.name || "",
        description: translations[0]?.description || "",
      })
    })

    const transformedData = modelServicesData
      .map((modelService) => {
        const serviceInfo = servicesMap.get(modelService.service_id)
        if (!serviceInfo) {
          console.warn(
            `[GET] /api/admin/model-services - Service not found for model service: ${JSON.stringify(modelService)}`,
          )
          return null
        }

        return {
          id: modelService.id,
          model_id: modelService.model_id,
          service_id: modelService.service_id,
          price: modelService.price,
          warranty_months: modelService.warranty_months ?? serviceInfo.default_warranty_months,
          duration_hours: modelService.duration_hours ?? serviceInfo.default_duration_hours,
          warranty_period: modelService.warranty_period || "months",
          detailed_description: modelService.detailed_description,
          what_included: modelService.what_included,
          benefits: modelService.benefits,
          part_type: modelService.part_type,
          services: serviceInfo,
        }
      })
      .filter((item) => item !== null)

    transformedData.sort((a, b) => {
      return (a.services.position || 0) - (b.services.position || 0)
    })

    console.log(`[GET] /api/admin/model-services - Returning ${transformedData.length} transformed model services`)
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("[GET] /api/admin/model-services - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to fetch model services", details: error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[POST] /api/admin/model-services - Request body:", body)

    const supabase = createClient()

    if (!body.modelId || !body.serviceId) {
      console.error("[POST] /api/admin/model-services - Missing required fields:", body)
      return NextResponse.json({ error: "modelId and serviceId are required" }, { status: 400 })
    }

    console.log(
      `[POST] /api/admin/model-services - Checking if model service exists: modelId=${body.modelId}, serviceId=${body.serviceId}`,
    )
    const { data: existingData, error: existingError } = await supabase
      .from("model_services")
      .select("id")
      .eq("model_id", body.modelId)
      .eq("service_id", body.serviceId)
      .maybeSingle()

    if (existingError) {
      console.error("[POST] /api/admin/model-services - Error checking existing model service:", existingError)
      return NextResponse.json(
        { error: "Failed to check existing model service", details: existingError },
        { status: 500 },
      )
    }

    const serviceData = {
      price: body.price,
      warranty_months: body.warranty_months,
      duration_hours: body.duration_hours,
      warranty_period: body.warranty_period || "months",
      detailed_description: body.detailed_description,
      what_included: body.what_included,
      benefits: body.benefits,
      part_type: body.part_type,
    }

    let result

    if (existingData) {
      console.log(`[POST] /api/admin/model-services - Updating existing model service with ID ${existingData.id}`)
      const { data, error } = await supabase
        .from("model_services")
        .update(serviceData)
        .eq("id", existingData.id)
        .select()
        .single()

      if (error) {
        console.error("[POST] /api/admin/model-services - Error updating model service:", error)
        return NextResponse.json({ error: "Failed to update model service", details: error }, { status: 500 })
      }

      console.log("[POST] /api/admin/model-services - Successfully updated model service:", data)
      result = data
    } else {
      console.log("[POST] /api/admin/model-services - Creating new model service")
      const { data, error } = await supabase
        .from("model_services")
        .insert({
          model_id: body.modelId,
          service_id: body.serviceId,
          ...serviceData,
        })
        .select()
        .single()

      if (error) {
        console.error("[POST] /api/admin/model-services - Error creating model service:", error)
        return NextResponse.json({ error: "Failed to create model service", details: error }, { status: 500 })
      }

      console.log("[POST] /api/admin/model-services - Successfully created model service:", data)
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[POST] /api/admin/model-services - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to create/update model service", details: error }, { status: 500 })
  }
}
