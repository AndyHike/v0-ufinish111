import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wrench, Phone, Clock, Shield } from "lucide-react"
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

  const { data: model } = await supabase
    .from("models")
    .select(`
      id,
      name,
      image_url,
      brands(name)
    `)
    .eq("slug", slug)
    .single()

  if (!model) {
    return {
      title: "Model not found | DeviceHelp",
      description: "The requested model could not be found.",
    }
  }

  const brandName = model.brands?.name || ""
  const modelName = model.name || ""

  return {
    title: `${brandName} ${modelName} - Ремонт та послуги | DeviceHelp`,
    description: `Професійний ремонт ${brandName} ${modelName}. Швидко, якісно, з гарантією. Замовляйте онлайн!`,
  }
}

export default async function ModelPage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Models" })
  const commonT = await getTranslations({ locale, namespace: "Common" })

  const supabase = createServerClient()

  try {
    // Отримуємо дані моделі
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
      .eq("slug", slug)
      .single()

    if (modelError || !model) {
      console.error("Error fetching model:", modelError)
      notFound()
    }

    // Отримуємо послуги для цієї моделі
    const { data: modelServices, error: servicesError } = await supabase
      .from("model_services")
      .select(`
        id,
        price,
        service_id,
        services(
          id,
          position,
          slug,
          services_translations(
            name,
            description,
            locale
          )
        )
      `)
      .eq("model_id", model.id)
      .order("services(position)")

    if (servicesError) {
      console.error("Error fetching services:", servicesError)
    }

    // Фільтруємо послуги з перекладами для поточної локалі
    const servicesWithTranslations =
      modelServices
        ?.map((ms) => {
          const service = ms.services
          if (!service) return null

          const translation = service.services_translations?.find((t: any) => t.locale === locale)
          if (!translation) return null

          return {
            ...ms,
            service: {
              ...service,
              translation,
            },
          }
        })
        .filter(Boolean) || []

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="container px-4 py-8 md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Кнопка повернення */}
            <Link
              href={`/${locale}/brands/${model.brands?.slug || model.brands?.id}`}
              className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {commonT("backTo") || "Назад до"} {model.brands?.name}
            </Link>

            {/* Заголовок моделі */}
            <div className="mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white shadow-lg flex-shrink-0">
                  <img
                    src={formatImageUrl(model.image_url) || "/placeholder.svg?height=96&width=96&query=phone"}
                    alt={model.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain p-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
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
                    <Badge variant="secondary" className="text-xs">
                      {model.brands?.name}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{model.name}</h1>
                  <p className="text-slate-600">{t("availableServices") || "Доступні послуги для вашого пристрою"}</p>
                </div>
              </div>
            </div>

            {/* Список послуг */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{t("repairServices") || "Послуги ремонту"}</h2>

              {servicesWithTranslations.length === 0 ? (
                <Card className="shadow-sm border-slate-200">
                  <CardContent className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Wrench className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {t("noServicesAvailable") || "Послуги недоступні"}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {t("noServicesDescription") || "На даний момент для цієї моделі немає доступних послуг."}
                    </p>
                    <Button asChild>
                      <Link href={`/${locale}/contact`}>{commonT("contactUs") || "Зв'язатися з нами"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {servicesWithTranslations.map((modelService: any) => (
                    <Card
                      key={modelService.id}
                      className="shadow-sm border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex-shrink-0">
                            <Wrench className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {modelService.service.translation.name}
                            </h3>
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                              {modelService.service.translation.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{t("fastService") || "Швидко"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                <span>{t("warranty") || "Гарантія"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-2xl font-bold text-slate-900 mb-2">
                              {modelService.price
                                ? formatCurrency(modelService.price)
                                : t("priceOnRequest") || "За запитом"}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link
                                  href={`/${locale}/services/${modelService.services?.slug || modelService.services?.id}?model=${model.slug}`}
                                >
                                  {commonT("learnMore") || "Детальніше"}
                                </Link>
                              </Button>
                              <Button size="sm" asChild>
                                <Link
                                  href={`/${locale}/contact?service=${encodeURIComponent(modelService.service.translation.name)}&model=${encodeURIComponent(model.name)}`}
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  {commonT("order") || "Замовити"}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* CTA секція */}
            <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("needHelp") || "Потрібна допомога?"}</h3>
                <p className="text-slate-600 mb-4">
                  {t("contactDescription") || "Наші експерти готові допомогти вам з будь-якими питаннями"}
                </p>
                <Button asChild>
                  <Link href={`/${locale}/contact?model=${encodeURIComponent(model.name)}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    {commonT("contactUs") || "Зв'язатися з нами"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in ModelPage:", error)
    return (
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Помилка завантаження</h1>
            <p className="text-slate-600">Не вдалося завантажити дані моделі. Спробуйте пізніше.</p>
            <Button asChild className="mt-4">
              <Link href={`/${locale}`}>На головну</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
