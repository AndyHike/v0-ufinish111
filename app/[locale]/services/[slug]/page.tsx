import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Phone, MessageCircle, Clock, Shield, CheckCircle, ChevronDown, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

type Props = {
  params: {
    locale: string
    slug: string
  }
  searchParams: {
    model?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params
  const supabase = createServerClient()

  let { data: service } = await supabase
    .from("services")
    .select(`
      id,
      services_translations(
        name,
        description,
        locale
      )
    `)
    .eq("slug", slug)
    .single()

  if (!service) {
    const { data } = await supabase
      .from("services")
      .select(`
        id,
        services_translations(
          name,
          description,
          locale
        )
      `)
      .eq("id", slug)
      .single()
    service = data
  }

  if (!service) {
    return {
      title: "Service not found | DeviceHelp",
      description: "The requested service could not be found.",
    }
  }

  const translation = service.services_translations?.find((t: any) => t.locale === locale)
  const serviceName = translation?.name || "Service"

  return {
    title: `${serviceName} | DeviceHelp`,
    description: translation?.description || `Professional ${serviceName} service with warranty.`,
  }
}

export default async function ServicePage({ params, searchParams }: Props) {
  const { slug, locale } = params
  const { model: modelSlug } = searchParams
  const t = await getTranslations({ locale, namespace: "Services" })
  const commonT = await getTranslations({ locale, namespace: "Common" })

  const supabase = createServerClient()

  try {
    let { data: service, error } = await supabase
      .from("services")
      .select(`
        id,
        position,
        warranty_months,
        duration_hours,
        image_url,
        slug,
        services_translations(
          name,
          description,
          detailed_description,
          what_included,
          locale
        )
      `)
      .eq("slug", slug)
      .single()

    if (!service) {
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          position,
          warranty_months,
          duration_hours,
          image_url,
          slug,
          services_translations(
            name,
            description,
            detailed_description,
            what_included,
            locale
          )
        `)
        .eq("id", slug)
        .single()

      service = data
      error = idError
    }

    if (error || !service) {
      notFound()
    }

    const translation = service.services_translations?.find((t: any) => t.locale === locale)

    if (!translation) {
      notFound()
    }

    // Отримуємо FAQ для послуги
    const { data: faqsData } = await supabase
      .from("service_faqs")
      .select(`
        id,
        position,
        service_faq_translations(
          question,
          answer,
          locale
        )
      `)
      .eq("service_id", service.id)
      .order("position")

    const faqs =
      faqsData
        ?.map((faq) => ({
          ...faq,
          translation: faq.service_faq_translations?.find((t: any) => t.locale === locale),
        }))
        .filter((faq) => faq.translation)
        .slice(0, 3) || [] // Показуємо тільки 3 найважливіші

    // Отримуємо дані моделі, якщо передано modelSlug
    let sourceModel = null
    let modelServicePrice = null
    if (modelSlug) {
      const { data: modelData } = await supabase
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

      sourceModel = modelData

      if (sourceModel) {
        const { data: modelServiceData } = await supabase
          .from("model_services")
          .select("price")
          .eq("model_id", sourceModel.id)
          .eq("service_id", service.id)
          .single()

        modelServicePrice = modelServiceData?.price
      }
    }

    // Отримуємо ціни для статистики
    const { data: modelServices } = await supabase.from("model_services").select("price").eq("service_id", service.id)

    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const minPrice = prices.length > 0 ? Math.min(...prices) : null
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null

    const backUrl = sourceModel ? `/${locale}/models/${sourceModel.slug}` : `/${locale}`
    const backText = sourceModel ? `${sourceModel.brands?.name} ${sourceModel.name}` : "Головна"

    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-gray-600">
              <Link href={backUrl} className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                {backText}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{translation.name}</span>
            </nav>

            {/* Header */}
            <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-100">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {translation.name}
                  {sourceModel && (
                    <span className="block text-xl font-normal text-gray-600 mt-2">
                      для {sourceModel.brands?.name} {sourceModel.name}
                    </span>
                  )}
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  {translation.detailed_description || translation.description}
                </p>
              </div>

              {/* Price and CTA */}
              <div className="text-center mb-8">
                <div className="mb-6">
                  {modelServicePrice ? (
                    <div className="text-4xl font-bold text-gray-900">{formatCurrency(modelServicePrice)}</div>
                  ) : minPrice && maxPrice ? (
                    <div className="text-4xl font-bold text-gray-900">
                      {minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">За запитом</div>
                  )}
                  <div className="text-gray-600 mt-2 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>від {service.duration_hours} години</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Гарантія {service.warranty_months} місяців</span>
                    </div>
                  </div>
                </div>

                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8" asChild>
                  <Link
                    href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}${sourceModel ? `&model=${encodeURIComponent(sourceModel.name)}` : ""}`}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Замовити послугу
                  </Link>
                </Button>
              </div>
            </div>

            {/* Service Image */}
            {service.image_url && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <img
                    src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                    alt={translation.name}
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* What's Included */}
            {whatIncludedList.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Що входить у послугу</h2>
                  <div className="space-y-3">
                    {whatIncludedList.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <div className="mb-8">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Часті питання</h2>
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <Collapsible key={faq.id}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 rounded-lg transition-colors">
                          <span className="font-semibold text-gray-900">{faq.translation.question}</span>
                          <ChevronDown className="h-5 w-5 text-gray-500 transition-transform ui-open:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <p className="text-gray-600 leading-relaxed">{faq.translation.answer}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Final CTA */}
            <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Залишилися питання?</h2>
              <p className="text-blue-100 mb-6 max-w-md mx-auto">
                Наші експерти готові відповісти на всі ваші питання та надати професійну консультацію
              </p>
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-50 border-white"
                asChild
              >
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Зв'язатися з нами
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in ServicePage:", error)
    return (
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Помилка завантаження</h1>
            <p className="text-gray-600">Не вдалося завантажити дані послуги. Спробуйте пізніше.</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}`}>На головну</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
