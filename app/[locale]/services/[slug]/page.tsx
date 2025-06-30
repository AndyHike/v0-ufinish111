import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, MessageCircle, Clock, Shield, Star, CheckCircle, Wrench, HelpCircle } from "lucide-react"
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
        .filter((faq) => faq.translation) || []

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
    const backText = sourceModel
      ? `${commonT("backTo") || "Назад до"} ${sourceModel.name}`
      : commonT("backToHome") || "На головну"

    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-6 md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href={backUrl} className="hover:text-primary transition-colors">
                {backText}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{translation.name}</span>
            </nav>

            {/* Hero Section - Компактний */}
            <div className="grid gap-8 lg:grid-cols-2 mb-10">
              {/* Ліва колонка - Зображення */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-64 h-64 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-sm">
                  {service.image_url ? (
                    <img
                      src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                      alt={translation.name}
                      width={256}
                      height={256}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md">
                        <Wrench className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700">{translation.name}</h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Права колонка - Деталі */}
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">Послуга</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">4.9</span>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-3">{translation.name}</h1>

                  {/* Ціна */}
                  <div className="mb-4">
                    {modelServicePrice ? (
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(modelServicePrice)}</div>
                    ) : minPrice && maxPrice ? (
                      <div className="text-2xl font-bold text-slate-900">
                        {minPrice === maxPrice
                          ? formatCurrency(minPrice)
                          : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-slate-900">За запитом</div>
                    )}
                  </div>
                </div>

                {/* Кнопки дій */}
                <div className="space-y-3">
                  <Button size="lg" className="w-full" asChild>
                    <Link
                      href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}${sourceModel ? `&model=${encodeURIComponent(sourceModel.name)}` : ""}`}
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Замовити послугу
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/${locale}/contact`}>
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Задати питання
                    </Link>
                  </Button>
                </div>

                {/* Переваги - Компактні */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Shield className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-sm">Гарантія</div>
                      <div className="text-xs text-muted-foreground">{service.warranty_months} міс</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">Виконання</div>
                      <div className="text-xs text-muted-foreground">{service.duration_hours} год</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section - Вище та розгорнуті */}
            {faqs.length > 0 && (
              <section className="mb-10">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-bold">Часті питання</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Відповіді на найпоширеніші питання</p>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <Card key={faq.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 text-slate-900">{faq.translation.question}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.translation.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <Separator className="my-8" />

            {/* Опис послуги - Компактний */}
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-4">Опис послуги</h2>
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {translation.detailed_description || translation.description}
                </p>

                {whatIncludedList.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold mb-3">Що входить у послугу:</h3>
                    <div className="grid gap-2 mb-4">
                      {whatIncludedList.map((item, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Фінальний блок консультації - Компактний */}
            <section className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-bold">Залишилися питання?</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Наші експерти готові відповісти на всі ваші питання
                </p>
                <Button asChild>
                  <Link href={`/${locale}/contact`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Зв'язатися з нами
                  </Link>
                </Button>
              </div>
            </section>
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
            <p className="text-slate-600">Не вдалося завантажити дані послуги. Спробуйте пізніше.</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}`}>На головну</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
