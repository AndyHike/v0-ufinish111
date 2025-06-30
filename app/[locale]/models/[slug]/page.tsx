import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Shield, Star, Wrench, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import { formatImageUrl } from "@/utils/image-url"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: model } = await supabase.from("models").select("*, brands(name)").eq("slug", slug).single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!model) {
    const { data } = await supabase.from("models").select("*, brands(name)").eq("id", slug).single()
    model = data
  }

  if (!model) {
    const titlePatterns = {
      cs: "Model nenalezen | DeviceHelp",
      en: "Model not found | DeviceHelp",
      uk: "Модель не знайдено | DeviceHelp",
    }

    const descriptionPatterns = {
      cs: "Požadovaný model zařízení nebyl nalezen.",
      en: "The requested device model could not be found.",
      uk: "Запитувану модель пристрою не вдалося знайти.",
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    }
  }

  const titlePatterns = {
    cs: `Oprava ${model.name} ${model.brands?.name} | DeviceHelp`,
    en: `${model.name} ${model.brands?.name} repair | DeviceHelp`,
    uk: `Ремонт ${model.name} ${model.brands?.name} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava ${model.name} od ${model.brands?.name}. Rychlé a kvalitní služby s garancí. Rezervujte si termín online.`,
    en: `Professional ${model.name} repair from ${model.brands?.name}. Fast and quality services with warranty. Book your appointment online.`,
    uk: `Професійний ремонт ${model.name} від ${model.brands?.name}. Швидкі та якісні послуги з гарантією. Забронюйте зустріч онлайн.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Models" })
  const commonT = await getTranslations({ locale, namespace: "Common" })

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: model, error: modelError } = await supabase
    .from("models")
    .select("*, brands(id, name, slug, logo_url), series(id, name, slug)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!model) {
    const { data, error } = await supabase
      .from("models")
      .select("*, brands(id, name, slug, logo_url), series(id, name, slug)")
      .eq("id", slug)
      .single()

    model = data
    modelError = error
  }

  if (modelError || !model) {
    notFound()
  }

  // Fetch services for this model with translations and extended data
  const { data: modelServices, error: modelServicesError } = await supabase
    .from("model_services")
    .select(`
      id, 
      price, 
      model_id, 
      service_id, 
      services(
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
          locale
        )
      )
    `)
    .eq("model_id", model.id)
    .order("services(position)", { ascending: true })

  // Transform model services data
  const transformedModelServices = modelServices
    ?.map((modelService) => {
      // Filter translations for the requested locale
      const translations = modelService.services.services_translations.filter(
        (translation: any) => translation.locale === locale,
      )

      if (translations.length === 0) {
        return null
      }

      return {
        id: modelService.id,
        model_id: modelService.model_id,
        service_id: modelService.service_id,
        price: modelService.price,
        service: {
          id: modelService.services.id,
          position: modelService.services.position,
          warranty_months: modelService.services.warranty_months,
          duration_hours: modelService.services.duration_hours,
          image_url: modelService.services.image_url,
          slug: modelService.services.slug,
          name: translations[0]?.name || "",
          description: translations[0]?.description || "",
          detailed_description: translations[0]?.detailed_description || "",
        },
      }
    })
    .filter(Boolean) // Remove null items

  // Визначаємо куди повертатися: до серії або до бренду
  const backUrl = model.series
    ? `/${locale}/series/${model.series.slug || model.series.id}`
    : `/${locale}/brands/${model.brands?.slug || model.brand_id}`

  const backText = model.series
    ? t("backToSeries", { series: model.series.name }) || `До серії ${model.series.name}`
    : t("backToBrand", { brand: model.brands?.name }) || `До ${model.brands?.name}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Кнопка повернення */}
          <Link
            href={backUrl}
            className="mb-8 inline-flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-white hover:text-slate-900 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            {backText}
          </Link>

          {/* Заголовок моделі */}
          <div className="mb-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-8">
              <div className="relative">
                <div className="h-32 w-32 lg:h-40 lg:w-40 overflow-hidden rounded-2xl bg-white shadow-lg">
                  <img
                    src={formatImageUrl(model.image_url) || "/placeholder.svg?height=160&width=160&query=phone+model"}
                    alt={model.name}
                    width={160}
                    height={160}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
                {/* Декоративний елемент */}
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              </div>

              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  {model.brands?.logo_url && (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white shadow-sm">
                      <img
                        src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                        alt={model.brands.name}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain p-1"
                      />
                    </div>
                  )}
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {model.brands?.name}
                  </Badge>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">{model.name}</h1>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  {t("modelPageDescription", { model: model.name, brand: model.brands?.name }) ||
                    `Професійний ремонт ${model.name} від ${model.brands?.name}. Швидко, якісно, з гарантією.`}
                </p>
              </div>
            </div>
          </div>

          {/* Заголовок послуг */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("availableServices") || "Доступні послуги"}</h2>
            <p className="text-slate-600">
              {t("servicesDescription") || "Оберіть послугу для отримання детальної інформації та замовлення"}
            </p>
          </div>

          {/* Список послуг */}
          {transformedModelServices && transformedModelServices.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {transformedModelServices.map((modelService) => (
                <Card
                  key={modelService.id}
                  className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white"
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Зображення послуги */}
                      <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {modelService.service.image_url ? (
                          <img
                            src={formatImageUrl(modelService.service.image_url) || "/placeholder.svg"}
                            alt={modelService.service.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <Wrench className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                        )}
                      </div>

                      {/* Контент */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {modelService.service.name}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {modelService.service.description}
                            </p>
                          </div>
                        </div>

                        {/* Метаінформація */}
                        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                          {modelService.service.duration_hours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{modelService.service.duration_hours}г</span>
                            </div>
                          )}
                          {modelService.service.warranty_months && (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>{modelService.service.warranty_months} міс</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>4.9</span>
                          </div>
                        </div>

                        {/* Ціна та кнопка */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-slate-900">
                              {modelService.price !== null ? formatCurrency(modelService.price) : t("priceOnRequest")}
                            </div>
                            {modelService.price !== null && <div className="text-xs text-slate-500">за цю модель</div>}
                          </div>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Link
                              href={`/${locale}/services/${modelService.service.slug || modelService.service.id}?model=${model.slug}`}
                            >
                              {commonT("viewService") || "Переглянути"}
                              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12 bg-white/80 backdrop-blur-sm">
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Wrench className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {t("noServicesAvailable") || "Послуги недоступні"}
                </h3>
                <p className="text-slate-600 mb-6">
                  {t("noServicesDescription") || "На даний момент для цієї моделі немає доступних послуг."}
                </p>
                <Button asChild>
                  <Link href={`/${locale}/contact`}>{commonT("contactUs") || "Зв'язатися з нами"}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* CTA секція */}
          <Card className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">{t("needHelp") || "Потрібна допомога?"}</h3>
              <p className="text-blue-100 mb-6">
                {t("contactDescription") || "Наші експерти готові допомогти вам з будь-якими питаннями"}
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>
                  {commonT("contactUs") || "Зв'язатися з нами"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
