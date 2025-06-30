import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, MessageCircle, Clock, Shield, Star, CheckCircle, Wrench } from "lucide-react"
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
          benefits,
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
            benefits,
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

    // Отримуємо статистику по послузі
    const { data: modelServices } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        model_id,
        models(
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
        )
      `)
      .eq("service_id", service.id)

    // Статистика
    const totalModels = modelServices?.length || 0
    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const minPrice = prices.length > 0 ? Math.min(...prices) : null
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null

    // Визначаємо URL для кнопки "Назад"
    const backUrl = sourceModel ? `/${locale}/models/${sourceModel.slug}` : `/${locale}`
    const backText = sourceModel
      ? `${commonT("backTo") || "Назад до"} ${sourceModel.name}`
      : commonT("backToHome") || "На головну"

    // Парсимо списки з тексту
    const whatIncludedList = translation.what_included?.split("\n").filter((item) => item.trim()) || []
    const benefitsList = translation.benefits?.split("\n").filter((item) => item.trim()) || []

    return (
      <div className="min-h-screen bg-white">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href={backUrl} className="hover:text-primary">
                {backText}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{translation.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Ліва колонка - Зображення */}
              <div className="space-y-6">
                {/* Основне зображення послуги */}
                <div className="aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  {service.image_url ? (
                    <img
                      src={formatImageUrl(service.image_url) || "/placeholder.svg"}
                      alt={translation.name}
                      width={400}
                      height={400}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
                        <Wrench className="h-12 w-12 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700">{translation.name}</h3>
                    </div>
                  )}
                </div>
              </div>

              {/* Права колонка - Деталі та замовлення */}
              <div className="space-y-6">
                {/* Заголовок та ціна */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary">Послуга</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-1">(4.9)</span>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-4">{translation.name}</h1>

                  {/* Ціна */}
                  <div className="mb-6">
                    {modelServicePrice ? (
                      <div>
                        <div className="text-3xl font-bold text-slate-900">{formatCurrency(modelServicePrice)}</div>
                        {sourceModel && (
                          <div className="text-sm text-muted-foreground">
                            для {sourceModel.brands?.name} {sourceModel.name}
                          </div>
                        )}
                      </div>
                    ) : minPrice && maxPrice ? (
                      <div>
                        <div className="text-3xl font-bold text-slate-900">
                          {minPrice === maxPrice
                            ? formatCurrency(minPrice)
                            : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                        </div>
                        <div className="text-sm text-muted-foreground">залежно від моделі пристрою</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold text-slate-900">За запитом</div>
                        <div className="text-sm text-muted-foreground">ціна залежить від складності роботи</div>
                      </div>
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

                {/* Переваги */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Гарантія {service.warranty_months} місяців</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="text-sm">Виконання за {service.duration_hours} год</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <span className="text-sm">Оригінальні запчастини</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">Досвідчені майстри</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Статистика */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Статистика послуги</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-lg">{totalModels}</div>
                        <div className="text-muted-foreground">підтримуваних моделей</div>
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{avgPrice ? formatCurrency(avgPrice) : "—"}</div>
                        <div className="text-muted-foreground">середня ціна</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator className="my-12" />

            {/* Опис послуги */}
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6">Опис послуги</h2>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {translation.detailed_description || translation.description}
                  </p>

                  {whatIncludedList.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-3">Що входить у послугу:</h3>
                      <ul className="space-y-2 mb-6">
                        {whatIncludedList.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <h3 className="text-lg font-semibold mb-3">Терміни виконання:</h3>
                  <p className="text-muted-foreground mb-6">
                    Зазвичай ремонт займає {service.duration_hours} {service.duration_hours === 1 ? "годину" : "години"}
                    , залежно від складності роботи та наявності запчастин.
                  </p>

                  {benefitsList.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-3">Наші переваги:</h3>
                      <ul className="space-y-2 mb-6">
                        {benefitsList.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Star className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Бічна панель */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Потрібна консультація?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Наші експерти готові відповісти на всі ваші питання
                    </p>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/${locale}/contact`}>Зв'язатися з нами</Link>
                    </Button>
                  </CardContent>
                </Card>

                {sourceModel && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Ваш пристрій</h3>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                          <img
                            src={
                              formatImageUrl(sourceModel.image_url) || "/placeholder.svg?height=48&width=48&query=phone"
                            }
                            alt={sourceModel.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{sourceModel.name}</div>
                          <div className="text-sm text-muted-foreground">{sourceModel.brands?.name}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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
