import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateUtils } from "@/lib/revalidate-utils"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const modelId = searchParams.get("model_id")
    const modelSlug = searchParams.get("model_slug")
    const locale = searchParams.get("locale") || "uk"
    const exportMode = searchParams.get("export") === "true"

    console.log(
      `[GET] /api/admin/model-services - Request params: modelId=${modelId}, modelSlug=${modelSlug}, locale=${locale}, export=${exportMode}`,
    )

    let finalModelId = modelId

    // Если передан slug, найдем ID модели
    if (modelSlug && !modelId) {
      const supabase = createClient()
      const { data: modelData, error: modelError } = await supabase
        .from("models")
        .select("id")
        .eq("slug", modelSlug)
        .single()

      if (modelError || !modelData) {
        console.error("[GET] /api/admin/model-services - Model not found for slug:", modelSlug)
        return NextResponse.json({ error: "Model not found" }, { status: 404 })
      }

      finalModelId = modelData.id
    }

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

      // Transform exported data to ensure all fields are serializable primitives
      const transformedExportData = modelServicesData.map((service) => ({
        id: String(service.id),
        model_id: String(service.model_id),
        service_id: String(service.service_id),
        price: service.price !== null ? Number(service.price) : null,
        warranty_months: service.warranty_months !== null ? Number(service.warranty_months) : null,
        duration_hours: service.duration_hours !== null ? Number(service.duration_hours) : null,
        detailed_description: service.detailed_description ? String(service.detailed_description) : null,
        benefits: service.benefits ? String(service.benefits) : null,
        part_type: service.part_type ? String(service.part_type) : null,
      }))

      return NextResponse.json({ services: transformedExportData })
    }

    if (!finalModelId) {
      console.error("[GET] /api/admin/model-services - Missing model_id or model_slug parameter")
      return NextResponse.json({ error: "Model ID or slug is required" }, { status: 400 })
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

    console.log(`[GET] /api/admin/model-services - Fetching model services for model ${finalModelId}`)
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
      .eq("model_id", finalModelId)

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

      servicesMap.set(String(service.id), {
        id: String(service.id),
        slug: String(service.slug),
        position: Number(service.position),
        image_url: service.image_url ? String(service.image_url) : null,
        default_warranty_months: Number(service.warranty_months),
        default_duration_hours: Number(service.duration_hours),
        name: String(translations[0]?.name || ""),
        description: String(translations[0]?.description || ""),
      })
    })

    const transformedData = modelServicesData
      .map((modelService) => {
        const serviceInfo = servicesMap.get(String(modelService.service_id))
        if (!serviceInfo) {
          console.warn(
            `[GET] /api/admin/model-services - Service not found for model service: ${JSON.stringify(modelService)}`,
          )
          return null
        }

        return {
          id: String(modelService.id),
          model_id: String(modelService.model_id),
          service_id: String(modelService.service_id),
          price: modelService.price !== null ? Number(modelService.price) : null,
          warranty_months: modelService.warranty_months !== null ? Number(modelService.warranty_months) : (serviceInfo.default_warranty_months || null),
          duration_hours: modelService.duration_hours !== null ? Number(modelService.duration_hours) : (serviceInfo.default_duration_hours || null),
          warranty_period: String(modelService.warranty_period || "months"),
          detailed_description: modelService.detailed_description ? String(modelService.detailed_description) : null,
          what_included: modelService.what_included ? String(modelService.what_included) : null,
          benefits: modelService.benefits ? String(modelService.benefits) : null,
          part_type: modelService.part_type ? String(modelService.part_type) : null,
          services: {
            id: String(serviceInfo.id),
            slug: String(serviceInfo.slug),
            position: Number(serviceInfo.position),
            image_url: serviceInfo.image_url ? String(serviceInfo.image_url) : null,
            default_warranty_months: Number(serviceInfo.default_warranty_months),
            default_duration_hours: Number(serviceInfo.default_duration_hours),
            name: String(serviceInfo.name),
            description: String(serviceInfo.description),
          },
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

    // Revalidate model page and service/model page after save
    try {
      const { data: modelInfo } = await supabase
        .from("models")
        .select("slug")
        .eq("id", body.modelId)
        .single()

      const { data: serviceInfo } = await supabase
        .from("services")
        .select("slug")
        .eq("id", body.serviceId)
        .single()

      if (modelInfo?.slug) {
        revalidateUtils.revalidateModelServices(
          String(modelInfo.slug),
          serviceInfo?.slug ? String(serviceInfo.slug) : undefined
        )
      }
    } catch (revalidateError) {
      console.error("[POST] /api/admin/model-services - Revalidation error (non-fatal):", revalidateError)
    }

    // Transform result to ensure all fields are serializable primitives
    const transformedResult = {
      id: String(result.id),
      model_id: String(result.model_id),
      service_id: String(result.service_id),
      price: result.price !== null ? Number(result.price) : null,
      warranty_months: result.warranty_months !== null ? Number(result.warranty_months) : null,
      duration_hours: result.duration_hours !== null ? Number(result.duration_hours) : null,
      warranty_period: String(result.warranty_period || "months"),
      detailed_description: result.detailed_description ? String(result.detailed_description) : null,
      what_included: result.what_included ? String(result.what_included) : null,
      benefits: result.benefits ? String(result.benefits) : null,
      part_type: result.part_type ? String(result.part_type) : null,
    }

    console.log("[POST] /api/admin/model-services - Returning transformed result:", transformedResult)
    return NextResponse.json(transformedResult)
  } catch (error) {
    console.error("[POST] /api/admin/model-services - Unexpected error:", error)
    return NextResponse.json({ error: "Failed to create/update model service", details: error }, { status: 500 })
  }
}
