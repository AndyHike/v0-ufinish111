import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"
    const modelSlug = searchParams.get("model")

    console.log(`[SERVICES API] Fetching service data for slug: ${slug}, locale: ${locale}, model: ${modelSlug}`)

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
      console.error("[SERVICES API] Service not found:", error)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    console.log(`[SERVICES API] Found service: ${service.id}`)

    // Знаходимо переклад для поточної локалі
    const translation =
      service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

    if (!translation) {
      console.error("[SERVICES API] Service translation not found for locale:", locale)
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
      console.log(`[SERVICES API] Fetching model-specific data for model: ${modelSlug}`)

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
        console.log(`[SERVICES API] Found model: ${model.id} - ${model.name}`)

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
          // Конвертуємо типи даних правильно
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

          console.log("[SERVICES API] Found and converted model-specific service data:", {
            original_price: modelService.price,
            converted_price: price,
            original_warranty_months: modelService.warranty_months,
            converted_warranty_months: warrantyMonths,
            original_duration_hours: modelService.duration_hours,
            converted_duration_hours: durationHours,
            warranty_period: modelService.warranty_period,
          })
        } else {
          console.log("[SERVICES API] No model-specific service data found:", modelServiceError)
        }
      } else {
        console.log("[SERVICES API] Model not found for slug:", modelSlug, modelError)
      }
    }

    // Отримуємо діапазон цін тільки якщо немає конкретної моделі або немає model service data
    let minPrice = null
    let maxPrice = null

    // ВАЖЛИВО: Показуємо діапазон тільки якщо немає modelSlug взагалі
    if (!modelSlug) {
      console.log("[SERVICES API] No model specified, fetching price range")
      const { data: priceData, error: priceError } = await supabase
        .from("model_services")
        .select("price")
        .eq("service_id", service.id)
        .not("price", "is", null)

      if (!priceError && priceData && priceData.length > 0) {
        const prices = priceData.map((p) => Number.parseFloat(p.price.toString())).filter((p) => !isNaN(p) && p > 0)
        if (prices.length > 0) {
          minPrice = Math.min(...prices)
          maxPrice = Math.max(...prices)
          console.log("[SERVICES API] Price range:", { minPrice, maxPrice })
        }
      }
    } else if (modelSlug && !modelServiceData) {
      console.log("[SERVICES API] Model specified but no service data found - showing price on request")
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
      minPrice: minPrice, // Показуємо тільки якщо немає modelSlug
      maxPrice: maxPrice,
    }

    console.log("[SERVICES API] Final service result:", {
      warranty_months: result.warranty_months,
      duration_hours: result.duration_hours,
      warranty_period: result.warranty_period,
      modelServicePrice: result.modelServicePrice,
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
      hasModelServiceData: !!modelServiceData,
      hasSourceModel: !!sourceModel,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[SERVICES API] Error in services API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
