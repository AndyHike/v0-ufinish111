import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
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
    const backText = sourceModel ? `${sourceModel.brands?.name} ${sourceModel.name}` : "Головна"

    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []

    // Фейкові відгуки для демонстрації
    const testimonials = [
      {
        id: 1,
        name: "Олександр К.",
        text: "Швидко та якісно замінили екран. Дуже задоволений результатом!",
        date: "2 тижні тому",
      },
      {
        id: 2,
        name: "Марія В.",
        text: "Професійний підхід, чесні ціни. Рекомендую!",
        date: "1 місяць тому",
      },
      {
        id: 3,
        name: "Дмитро П.",
        text: "Відмінний сервіс, телефон працює як новий.",
        date: "3 тижні тому",
      },
    ]

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href={backUrl} className="hover:text-blue-600 transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Link>
          </nav>

          {/* Збалансований двоколонковий макет */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Ліва колонка - компактне фото з правильним масштабуванням */}
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden max-h-80">
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

            {/* Права колонка - збалансована з лівою */}
            <div className="space-y-5">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{translation.name}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {translation.detailed_description || translation.description}
                </p>
              </div>

              {/* Ціна */}
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {modelServicePrice
                    ? formatCurrency(modelServicePrice)
                    : minPrice && maxPrice
                      ? minPrice === maxPrice
                        ? formatCurrency(minPrice)
                        : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
                      : "За запитом"}
                </div>
                {sourceModel && (
                  <p className="text-gray-600 text-sm">
                    для {sourceModel.brands?.name} {sourceModel.name}
                  </p>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 py-3" asChild>
                  <Link
                    href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}${sourceModel ? `&model=${encodeURIComponent(sourceModel.name)}` : ""}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Замовити послугу
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-gray-300 hover:bg-gray-50 py-3 bg-transparent"
                  asChild
                >
                  <Link href={`/${locale}/contact`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Задати питання
                  </Link>
                </Button>
              </div>

              {/* Компактні переваги */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Час виконання</div>
                    <div className="text-xs text-gray-600">від {service.duration_hours} години</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Гарантія</div>
                    <div className="text-xs text-gray-600">{service.warranty_months} місяців</div>
                  </div>
                </div>
              </div>

              {/* Що входить у послугу - перенесено в праву колонку */}
              {whatIncludedList.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Що входить у послугу</h3>
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

          {/* Повноширинні секції - зменшені відступи */}
          <div className="space-y-10">
            {/* FAQ Section */}
            {faqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-5">Часті питання</h2>
                <div className="space-y-3 max-w-4xl">
                  {faqs.map((faq) => (
                    <Collapsible key={faq.id}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span className="font-semibold text-gray-900">{faq.translation.question}</span>
                        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform ui-open:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.translation.answer}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </section>
            )}

            {/* Відгуки клієнтів */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Відгуки клієнтів</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                        <div className="text-xs text-gray-500">{testimonial.date}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">"{testimonial.text}"</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-blue-600 rounded-xl p-8 text-center text-white">
              <h2 className="text-2xl font-bold mb-3">Залишилися питання?</h2>
              <p className="text-blue-100 mb-6 max-w-xl mx-auto">
                Наші експерти готові відповісти на всі ваші питання та надати професійну консультацію
              </p>
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-blue-600 hover:bg-gray-50 border-white px-6 py-3"
                asChild
              >
                <Link href={`/${locale}/contact`}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Зв'язатися з нами
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
          <h1 className="text-2xl font-bold text-red-600 mb-2">Помилка завантаження</h1>
          <p className="text-gray-600 mb-6">Не вдалося завантажити дані послуги. Спробуйте пізніше.</p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    )
  }
}
