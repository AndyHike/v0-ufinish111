import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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

  // Спочатку спробуємо знайти за slug
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

  // Якщо не знайдено за slug, спробуємо за ID
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
    // Спочатку спробуємо знайти за slug
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

    // Якщо не знайдено за slug, спробуємо за ID
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

    // Знаходимо переклад для поточної локалі
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

      // Отримуємо ціну для цієї моделі
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

    // Визначаємо URL для кнопки "Назад"
    const backUrl = sourceModel ? `/${locale}/models/${sourceModel.slug}` : `/${locale}`
    const backText = sourceModel
      ? `${commonT("backTo") || "Назад до"} ${sourceModel.name}`
      : commonT("backToHome") || "На головну"

    // Парсимо списки з тексту
    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-muted-foreground">
              <Link href={backUrl} className="hover:text-primary transition-colors">
                {backText}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{translation.name}</span>
            </nav>

            {/* Hero Section */}
            <div className="grid gap-12 lg:grid-cols-2 mb-16">
              {/* Ліва колонка - Зображення */}
              <div className="space-y-6">
                <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-lg">
                  {service.image_url ? (
                    <img
                      src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                      alt={translation.name}
                      width={500}
                      height={500}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-xl">
                        <Wrench className="h-16 w-16 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700">{translation.name}</h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Права колонка - Деталі та замовлення */}
              <div className="space-y-8">
                {/* Заголовок та рейтинг */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm">
                      Послуга
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-2">(4.9)</span>
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">{translation.name}</h1>

                  {/* Ціна */}
                  <div className="mb-8">
                    {modelServicePrice ? (
                      <div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {formatCurrency(modelServicePrice)}
                        </div>
                        {sourceModel && (
                          <div className="text-muted-foreground">
                            для {sourceModel.brands?.name} {sourceModel.name}
                          </div>
                        )}
                      </div>
                    ) : minPrice && maxPrice ? (
                      <div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {minPrice === maxPrice
                            ? formatCurrency(minPrice)
                            : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </div>
                        <div className="text-muted-foreground">залежно від моделі пристрою</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl font-bold text-slate-900 mb-2">За запитом</div>
                        <div className="text-muted-foreground">ціна залежить від складності роботи</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопки дій */}
                <div className="space-y-4">
                  <Button size="lg" className="w-full h-14 text-lg" asChild>
                    <Link
                      href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}${sourceModel ? `&model=${encodeURIComponent(sourceModel.name)}` : ""}`}
                    >
                      <Phone className="h-5 w-5 mr-3" />
                      Замовити послугу
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full h-14 text-lg bg-transparent" asChild>
                    <Link href={`/${locale}/contact`}>
                      <MessageCircle className="h-5 w-5 mr-3" />
                      Задати питання
                    </Link>
                  </Button>
                </div>

                {/* Переваги */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Гарантія</div>
                          <div className="text-sm text-muted-foreground">{service.warranty_months} місяців</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Виконання</div>
                          <div className="text-sm text-muted-foreground">{service.duration_hours} год</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                          <CheckCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Запчастини</div>
                          <div className="text-sm text-muted-foreground">Оригінальні</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                          <Star className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Майстри</div>
                          <div className="text-sm text-muted-foreground">Досвідчені</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Інформація про пристрій */}
                {sourceModel && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Ваш пристрій</h3>
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-100">
                          <img
                            src={
                              formatImageUrl(sourceModel.image_url) || "/placeholder.svg?height=64&width=64&query=phone"
                            }
                            alt={sourceModel.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{sourceModel.name}</div>
                          <div className="text-muted-foreground">{sourceModel.brands?.name}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Separator className="my-16" />

            {/* Опис послуги */}
            <section className="mb-16">
              <div className="grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h2 className="text-3xl font-bold mb-8">Опис послуги</h2>
                  <div className="prose max-w-none">
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      {translation.detailed_description || translation.description}
                    </p>

                    {whatIncludedList.length > 0 && (
                      <>
                        <h3 className="text-xl font-semibold mb-6">Що входить у послугу:</h3>
                        <div className="grid gap-4 mb-8">
                          {whatIncludedList.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <h3 className="text-xl font-semibold mb-6">Терміни виконання:</h3>
                    <div className="p-6 bg-blue-50 rounded-lg mb-8">
                      <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Зазвичай ремонт займає {service.duration_hours}{" "}
                            {service.duration_hours === 1 ? "годину" : "години"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            залежно від складності роботи та наявності запчастин
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            {faqs.length > 0 && (
              <>
                <Separator className="my-16" />
                <section className="mb-16">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <HelpCircle className="h-8 w-8 text-blue-600" />
                      <h2 className="text-3xl font-bold">Часті питання</h2>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Відповіді на найпоширеніші питання про цю послугу
                    </p>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqs.map((faq, index) => (
                        <AccordionItem
                          key={faq.id}
                          value={`item-${index}`}
                          className="border rounded-lg px-6 bg-white shadow-sm"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-6">
                            <span className="font-semibold text-lg">{faq.translation.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-6">
                            <div className="text-muted-foreground leading-relaxed">{faq.translation.answer}</div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </section>
              </>
            )}

            {/* Фінальний блок консультації */}
            <Separator className="my-16" />
            <section className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                      <MessageCircle className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Залишилися питання?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Наші експерти готові відповісти на всі ваші питання та надати професійну консультацію
                  </p>
                </div>

                <div className="space-y-4">
                  <Button size="lg" className="h-14 px-8 text-lg" asChild>
                    <Link href={`/${locale}/contact`}>
                      <Phone className="h-5 w-5 mr-3" />
                      Зв'язатися з нами
                    </Link>
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Або зателефонуйте нам: <span className="font-semibold">+380 XX XXX XX XX</span>
                  </div>
                </div>
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
