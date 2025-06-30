import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wrench, Clock, Shield, Star, Phone, MapPin } from "lucide-react"
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
      const { data, error: idError } = await supabase
        .from("services")
        .select(`
          id,
          position,
          services_translations(
            name,
            description,
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
    if (modelSlug) {
      const { data } = await supabase
        .from("models")
        .select(`
          id,
          name,
          slug,
          image_url,
          brands(
            id,
            name,
            slug
          )
        `)
        .eq("slug", modelSlug)
        .single()
      sourceModel = data
    }

    // Отримуємо всі моделі, які підтримують цю послугу
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

    // Групуємо за брендами
    const brandGroups =
      modelServices?.reduce((acc: any, item) => {
        const brandName = item.models?.brands?.name || "Unknown"
        if (!acc[brandName]) {
          acc[brandName] = {
            brand: item.models?.brands,
            models: [],
          }
        }
        acc[brandName].models.push(item)
        return acc
      }, {}) || {}

    // Статистика
    const totalModels = modelServices?.length || 0
    const totalBrands = Object.keys(brandGroups).length
    const prices = modelServices?.map((ms) => ms.price).filter((p) => p !== null) || []
    const minPrice = prices.length > 0 ? Math.min(...prices) : null
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null

    // Визначаємо URL для кнопки "Назад"
    const backUrl = sourceModel ? `/${locale}/models/${sourceModel.slug}` : `/${locale}`

    const backText = sourceModel
      ? `${commonT("backTo") || "Назад до"} ${sourceModel.name}`
      : commonT("backToHome") || "На головну"

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Кнопка повернення */}
            <Link
              href={backUrl}
              className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Link>

            {/* Заголовок послуги */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <Wrench className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{translation.name}</h1>
                  <p className="text-slate-600 text-lg leading-relaxed">{translation.description}</p>
                </div>
              </div>

              {/* Статистика в компактному вигляді */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-2xl font-bold text-blue-600">{totalModels}</div>
                  <div className="text-sm text-slate-500">{t("supportedModels") || "Моделей"}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-2xl font-bold text-green-600">{totalBrands}</div>
                  <div className="text-sm text-slate-500">{t("supportedBrands") || "Брендів"}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-2xl font-bold text-orange-600">{minPrice ? formatCurrency(minPrice) : "—"}</div>
                  <div className="text-sm text-slate-500">{t("priceFrom") || "Від"}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="text-2xl font-bold text-purple-600">{maxPrice ? formatCurrency(maxPrice) : "—"}</div>
                  <div className="text-sm text-slate-500">{t("priceTo") || "До"}</div>
                </div>
              </div>
            </div>

            {/* Переваги послуги */}
            <Card className="mb-8 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Star className="h-5 w-5 text-yellow-500" />
                  {t("whyChooseUs") || "Чому обирають нас"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 flex-shrink-0">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{t("warranty") || "Гарантія"}</h3>
                      <p className="text-sm text-slate-600">
                        {t("warrantyDescription") || "Надаємо гарантію на всі виконані роботи"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 flex-shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{t("fastService") || "Швидко"}</h3>
                      <p className="text-sm text-slate-600">
                        {t("fastServiceDescription") || "Виконуємо роботи в найкоротші терміни"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 flex-shrink-0">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{t("quality") || "Якість"}</h3>
                      <p className="text-sm text-slate-600">
                        {t("qualityDescription") || "Використовуємо тільки оригінальні запчастини"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Підтримувані моделі */}
            <Card className="mb-8 shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">{t("availableFor") || "Доступно для"}</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(brandGroups).map(([brandName, group]: [string, any]) => (
                  <div key={brandName} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-3 mb-4">
                      {group.brand?.logo_url && (
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white shadow-sm">
                          <img
                            src={formatImageUrl(group.brand.logo_url) || "/placeholder.svg"}
                            alt={brandName}
                            width={32}
                            height={32}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-slate-900">{brandName}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.models.length} {t("models") || "моделей"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.models.slice(0, 6).map((modelService: any) => (
                        <div
                          key={modelService.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white shadow-sm flex-shrink-0">
                            <img
                              src={
                                formatImageUrl(modelService.models?.image_url) ||
                                "/placeholder.svg?height=40&width=40&query=phone" ||
                                "/placeholder.svg"
                              }
                              alt={modelService.models?.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">{modelService.models?.name}</h4>
                            <div className="text-sm font-semibold text-blue-600">
                              {modelService.price
                                ? formatCurrency(modelService.price)
                                : t("priceOnRequest") || "За запитом"}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild className="flex-shrink-0 bg-transparent">
                            <Link href={`/${locale}/models/${modelService.models?.slug || modelService.models?.id}`}>
                              {commonT("view") || "Переглянути"}
                            </Link>
                          </Button>
                        </div>
                      ))}
                      {group.models.length > 6 && (
                        <div className="sm:col-span-2 text-center py-2">
                          <span className="text-sm text-slate-500">
                            {t("andMore") || "та ще"} {group.models.length - 6} {t("models") || "моделей"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CTA секція */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Phone className="h-6 w-6" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("readyToOrder") || "Готові замовити?"}</h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {t("contactUsDescription") ||
                    "Зв'яжіться з нами для отримання детальної консультації та запису на ремонт"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {commonT("contactUs") || "Зв'язатися з нами"}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href={`/${locale}/contact`}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {t("findLocation") || "Знайти адресу"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
