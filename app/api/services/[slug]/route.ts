import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getPriceWithDiscount } from "@/lib/discounts/get-applicable-discounts"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const supabase = createClient()
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"
    const modelSlug = searchParams.get("model")

    console.log(`[API] Fetching service data for slug: ${slug}, locale: ${locale}, model: ${modelSlug}`)

    // Спочатку спробуємо знайти за slug
    let { data: service, error } = await supabase
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
          warranty_months,
          duration_hours,
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
      console.error("[API] Service not found:", error)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    console.log(`[API] Found service: ${service.id}`)

    // Знаходимо переклад для поточної локалі
    const translation =
      service.services_translations?.find((t) => t.locale === locale) || service.services_translations?.[0]

    if (!translation) {
      console.error("[API] Service translation not found for locale:", locale)
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
    let discountedPrice = null
    let hasDiscount = false
    let discount = null

    if (modelSlug) {
      console.log(`[API] Fetching model-specific data for model: ${modelSlug}`)

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
            benefits,
            part_type
          `)
          .eq("model_id", model.id)
          .eq("service_id", service.id)
          .single()

        if (!modelServiceError && modelService) {
          // Правильна конвертація типів даних з перевіркою на null/undefined
          const price =
            modelService.price !== null && modelService.price !== undefined
              ? Number.parseFloat(modelService.price.toString())
              : null
          const warrantyMonths =
            modelService.warranty_months !== null && modelService.warranty_months !== undefined
              ? Number.parseInt(modelService.warranty_months.toString())
              : null
          const durationHours =
            modelService.duration_hours !== null && modelService.duration_hours !== undefined
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
            part_type: modelService.part_type || null,
          }

          if (price !== null) {
            const discountInfo = await getPriceWithDiscount(service.id, model.id, price)
            if (discountInfo.hasDiscount) {
              discountedPrice = discountInfo.discountedPrice
              hasDiscount = true
              discount = discountInfo.discount
            }
          }

          console.log("[API] Found and converted model-specific service data:", {
            original_price: modelService.price,
            converted_price: price,
            discounted_price: discountedPrice,
            has_discount: hasDiscount,
            original_warranty_months: modelService.warranty_months,
            converted_warranty_months: warrantyMonths,
            original_duration_hours: modelService.duration_hours,
            converted_duration_hours: durationHours,
            warranty_period: modelService.warranty_period,
          })
        } else {
          console.log("[API] No model-specific service data found:", modelServiceError)
        }
      } else {
        console.log("[API] Model not found:", modelError)
      }
    }

    // Отримуємо діапазон цін тільки якщо немає конкретної моделі або немає model service data
    let minPrice = null
    let maxPrice = null

    if (!modelSlug || !modelServiceData) {
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
          console.log("[API] Price range:", { minPrice, maxPrice })
        }
      }
    }

    const result = {
      id: service.id,
      slug: service.slug,
      position: service.position,
      image_url: service.image_url,
      // ВИПРАВЛЕНО: Використовуємо пріоритетну логіку - model_services має пріоритет над services
      warranty_months:
        modelServiceData?.warranty_months !== null && modelServiceData?.warranty_months !== undefined
          ? modelServiceData.warranty_months
          : service.warranty_months,
      duration_hours:
        modelServiceData?.duration_hours !== null && modelServiceData?.duration_hours !== undefined
          ? modelServiceData.duration_hours
          : service.duration_hours,
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
      discountedPrice,
      hasDiscount,
      discount,
      part_type: modelServiceData?.part_type || null,
    }

    console.log("[API] Final service result:", {
      warranty_months: result.warranty_months,
      warranty_source: modelServiceData?.warranty_months !== null ? "model_services" : "services",
      duration_hours: result.duration_hours,
      duration_source: modelServiceData?.duration_hours !== null ? "model_services" : "services",
      warranty_period: result.warranty_period,
      modelServicePrice: result.modelServicePrice,
      discountedPrice: result.discountedPrice,
      hasDiscount: result.hasDiscount,
      minPrice: result.minPrice,
      maxPrice: result.maxPrice,
      hasModelServiceData: !!modelServiceData,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error in services API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
