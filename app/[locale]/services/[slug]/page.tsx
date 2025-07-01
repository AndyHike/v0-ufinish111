import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Phone, MessageCircle, Clock, Shield, CheckCircle, ChevronDown, ArrowLeft, User } from "lucide-react"
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

  const t = await getTranslations("Services")
  const commonT = await getTranslations("Common")

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
        .slice(0, 3) || []

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
    const backText = sourceModel ? `${sourceModel.brands?.name} ${sourceModel.name}` : commonT("home")

    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-gray-500">
            <Link href={backUrl} className="hover:text-blue-600 transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Link>
          </nav>

          {/* Компактний двоколонковий макет */}
          <div className="grid lg:grid-cols-5 gap-6 mb-8">
            {/* Ліва колонка - збільшене фото (2 колонки з 5) */}
            <div className="lg:col-span-2">
              <div className="aspect-[5/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                {service.image_url ? (
                  <img
                    src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                    alt={translation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700">{translation.name}</h3>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Права колонка - основна інформація (3 колонки з 5) */}
            <div className="lg:col-span-3 space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{translation.name}</h1>
                <p className="text-gray-600 leading-relaxed">
                  {translation.detailed_description || translation.description}
                </p>
              </div>

              {/* Ціна */}
              <div>
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                  {modelServicePrice
                    ? formatCurrency(modelServicePrice)
                    : minPrice && maxPrice
                      ? minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                      : t("priceOnRequest")}
                </div>
                {sourceModel && (
                  <p className="text-gray-600 text-sm">
                    {t("forModel", { brand: sourceModel.brands?.name, model: sourceModel.name })}
                  </p>
                )}
              </div>

              {/* Компактні переваги */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t("executionTime")}</div>
                    <div className="text-xs text-gray-600">
                      {service.duration_hours ? t("fromHours", { hours: service.duration_hours }) : t("contactForTime")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t("warranty")}</div>
                    <div className="text-xs text-gray-600">
                      {service.warranty_months
                        ? t("months", { count: service.warranty_months })
                        : t("contactForWarranty")}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 py-3" asChild>
                  <Link
                    href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}${sourceModel ? `&model=${encodeURIComponent(sourceModel.name)}` : ""}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {t("orderService")}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 py-3 bg-transparent"
                  asChild
                >
                  <Link href={`/${locale}/contact`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("askQuestion")}
                  </Link>
                </Button>
              </div>

              {/* Що входить у послугу */}
              {whatIncludedList.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{t("whatIncluded")}</h3>
                  <div className="space-y-2">
                    {whatIncludedList.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Компактні повноширинні секції */}
          <div className="space-y-8">
            {/* FAQ Section */}
            {faqs.length > 0 && (
              <section>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">{t("frequentQuestions")}</h2>
                <div className="space-y-3 max-w-4xl">
                  {faqs.map((faq) => (
                    <Collapsible key={faq.id}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span className="font-semibold text-gray-900 text-sm lg:text-base">
                          {faq.translation.question}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform ui-open:rotate-180 flex-shrink-0 ml-2" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{faq.translation.answer}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

            {/* Відгуки клієнтів */}
            <section>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4">{t("clientReviews")}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{t(`testimonial${i}Name`)}</div>
                        <div className="text-xs text-gray-500">{t(`testimonial${i}Date`)}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">"{t(`testimonial${i}Text`)}"</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-blue-600 rounded-xl p-6 lg:p-8 text-center text-white">
              <h2 className="text-xl lg:text-2xl font-bold mb-2">{t("haveQuestions")}</h2>
              <p className="text-blue-100 mb-4 lg:mb-6 max-w-xl mx-auto text-sm lg:text-base">{t("expertsReady")}</p>
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-50 border-white px-6 py-3"
                asChild
              >
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {commonT("contactUs")}
                </Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in ServicePage:", error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t("loadingError")}</h1>
          <p className="text-gray-600 mb-6">{t("loadingErrorDescription")}</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {commonT("home")}
          </Link>
        </div>
      </div>
    )
  }
}
