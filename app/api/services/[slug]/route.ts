import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"
    const modelSlug = searchParams.get("model")

    console.log(`Fetching service data for slug: ${slug}, locale: ${locale}, model: ${modelSlug}`)

    // Get service with translations and FAQs
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select(
        `
        id,
        slug,
        position,
        image_url,
        services_translations (
          locale,
          name,
          description,
          detailed_description,
          what_included,
          benefits
        ),
        service_faqs (
          id,
          position,
          service_faq_translations (
            locale,
            question,
            answer
          )
        )
      `,
      )
      .eq("slug", slug)
      .single()

    if (serviceError) {
      console.error("Service error:", serviceError)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    console.log("Found service:", service)

    // Find translation for current locale, fallback to first available
    const translation =
      service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

    if (!translation) {
      return NextResponse.json({ error: "Service translation not found" }, { status: 404 })
    }

    // Transform FAQs
    const faqs = service.service_faqs
      ?.map((faq) => {
        const faqTranslation =
          faq.service_faq_translations?.find((t) => t.locale === locale) || faq.service_faq_translations?.[0]

        if (!faqTranslation) return null

        return {
          id: faq.id,
          position: faq.position,
          translation: {
            question: faqTranslation.question,
            answer: faqTranslation.answer,
          },
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position)

    // Get model-specific data if model is provided
    let sourceModel = null
    let modelServicePrice = null
    let modelServiceData = null

    if (modelSlug) {
      console.log(`Fetching model-specific data for model: ${modelSlug}`)

      // Get model info
      const { data: model, error: modelError } = await supabase
        .from("models")
        .select(
          `
          id,
          name,
          slug,
          image_url,
          brands (
            id,
            name,
            slug,
            logo_url
          )
        `,
        )
        .eq("slug", modelSlug)
        .single()

      if (!modelError && model) {
        sourceModel = model

        // Get model-specific service data
        const { data: modelService, error: modelServiceError } = await supabase
          .from("model_services")
          .select(
            `
            price,
            warranty_months,
            duration_hours,
            warranty_period,
            detailed_description,
            what_included,
            benefits
          `,
          )
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .single()

        if (!modelServiceError && modelService) {
          modelServicePrice = modelService.price
          modelServiceData = {
            warranty_months: modelService.warranty_months,
            duration_hours: modelService.duration_hours,
            warranty_period: modelService.warranty_period,
            detailed_description: modelService.detailed_description,
            what_included: modelService.what_included,
            benefits: modelService.benefits,
          }
          console.log("Found model-specific service data:", modelServiceData)
        }
      }
    }

    // Get price range from all model services if no specific model
    let minPrice = null
    let maxPrice = null

    if (!modelSlug) {
      const { data: priceData, error: priceError } = await supabase
        .from("model_services")
        .select("price")
        .eq("service_id", service.id)
        .not("price", "is", null)

      if (!priceError && priceData && priceData.length > 0) {
        const prices = priceData.map((p) => p.price).filter((p) => p !== null)
        if (prices.length > 0) {
          minPrice = Math.min(...prices)
          maxPrice = Math.max(...prices)
        }
      }
    }

    const result = {
      id: service.id,
      slug: service.slug,
      position: service.position,
      image_url: service.image_url,
      // Use model-specific data if available, otherwise use service defaults
      warranty_months: modelServiceData?.warranty_months || null,
      duration_hours: modelServiceData?.duration_hours || null,
      warranty_period: modelServiceData?.warranty_period || "months",
      translation: {
        name: translation.name,
        description: translation.description,
        // Use model-specific detailed description if available
        detailed_description: modelServiceData?.detailed_description || translation.detailed_description,
        what_included: modelServiceData?.what_included || translation.what_included,
        benefits: modelServiceData?.benefits || translation.benefits,
      },
      faqs: faqs || [],
      sourceModel,
      modelServicePrice,
      minPrice,
      maxPrice,
    }

    console.log("Final service result:", {
      ...result,
      translation: { ...result.translation, detailed_description: "..." }, // Truncate for logging
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
