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

    // Спочатку спробуємо знайти за slug
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        position,
        image_url,
        services_translations(
          name,
          description,
          detailed_description,
          what_included,
          benefits,
          locale
        ),
        service_faqs(
          id,
          position,
          service_faq_translations(
            question,
            answer,
            locale
          )
        )
      `)
      .eq("slug", slug)
      .single()

    // Якщо не знайдено за slug, спробуємо за ID
    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          slug,
          position,
          image_url,
          services_translations(
            name,
            description,
            detailed_description,
            what_included,
            benefits,
            locale
          ),
          service_faqs(
            id,
            position,
            service_faq_translations(
              question,
              answer,
              locale
            )
          )
        `)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      console.error("Service not found:", error)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    console.log("Found service:", service.id)

    // Знаходимо переклад для поточної локалі
    const translation =
      service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

    if (!translation) {
      return NextResponse.json({ error: "Service translation not found" }, { status: 404 })
    }

    // Трансформуємо FAQ
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

    // Отримуємо дані для конкретної моделі якщо вказана
    let sourceModel = null
    let modelServiceData = null

    if (modelSlug) {
      console.log(`Fetching model-specific data for model: ${modelSlug}`)

      // Отримуємо інформацію про модель
      const { data: model, error: modelError } = await supabase
        .from("models")
        .select(`
          id,
          name,
          slug,
          image_url,
          brands(
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq("slug", modelSlug)
        .single()

      if (!modelError && model) {
        sourceModel = model

        // Отримуємо дані послуги для конкретної моделі з model_services
        const { data: modelService, error: modelServiceError } = await supabase
          .from("model_services")
          .select(`
            price,
            warranty_months,
            duration_hours,
            warranty_period,
            detailed_description,
            what_included,
            benefits
          `)
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .single()

        if (!modelServiceError && modelService) {
          // Правильна конвертація типів даних
          const price = modelService.price ? Number.parseFloat(modelService.price.toString()) : null
          const warrantyMonths = modelService.warranty_months
            ? Number.parseInt(modelService.warranty_months.toString())
            : null
          const durationHours = modelService.duration_hours
            ? Number.parseFloat(modelService.duration_hours.toString())
            : null

          modelServiceData = {
            price: price,
            warranty_months: warrantyMonths,
            duration_hours: durationHours,
            warranty_period: modelService.warranty_period || "months",
            detailed_description: modelService.detailed_description,
            what_included: modelService.what_included,
            benefits: modelService.benefits,
          }

          console.log("Found model-specific service data:", {
            price: price,
            warranty_months: warrantyMonths,
            duration_hours: durationHours,
            warranty_period: modelService.warranty_period,
          })
        } else {
          console.log("No model-specific service data found")
        }
      }
    }

    // Отримуємо діапазон цін тільки якщо немає конкретної моделі
    let minPrice = null
    let maxPrice = null

    if (!modelSlug) {
      const { data: priceData, error: priceError } = await supabase
        .from("model_services")
        .select("price")
        .eq("service_id", service.id)
        .not("price", "is", null)

      if (!priceError && priceData && priceData.length > 0) {
        const prices = priceData.map((p) => Number.parseFloat(p.price.toString())).filter((p) => !isNaN(p))
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
      // Використовуємо дані з model_services якщо є, інакше null
      warranty_months: modelServiceData?.warranty_months || null,
      duration_hours: modelServiceData?.duration_hours || null,
      warranty_period: modelServiceData?.warranty_period || "months",
      translation: {
        name: translation.name,
        description: translation.description,
        // Використовуємо модель-специфічні дані якщо є
        detailed_description: modelServiceData?.detailed_description || translation.detailed_description,
        what_included: modelServiceData?.what_included || translation.what_included,
        benefits: modelServiceData?.benefits || translation.benefits,
      },
      faqs: faqs || [],
      sourceModel,
      // ВАЖЛИВО: Використовуємо ціну з model_services
      modelServicePrice: modelServiceData?.price !== undefined ? modelServiceData.price : null,
      minPrice: modelServiceData ? null : minPrice, // Не показуємо діапазон якщо є конкретна модель
      maxPrice: modelServiceData ? null : maxPrice,
    }

    console.log("Final service result:", {
      warranty_months: result.warranty_months,
      duration_hours: result.duration_hours,
      warranty_period: result.warranty_period,
      modelServicePrice: result.modelServicePrice,
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
      hasModelServiceData: !!modelServiceData,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in services API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
