import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Wrench, Clock, Shield, Star } from "lucide-react"
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

export default async function ServicePage({ params }: Props) {
  const { slug, locale } = params
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

    return (
      <div className="container px-4 py-12 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          {/* Кнопка повернення */}
          <Link
            href={`/${locale}`}
            className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonT("backToHome") || "На головну"}
          </Link>

          {/* Заголовок послуги */}
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wrench className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{translation.name}</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground md:text-xl/relaxed">{translation.description}</p>
          </div>

          {/* Статистика */}
          <div className="mb-12 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{totalModels}</div>
                <div className="text-sm text-muted-foreground">{t("supportedModels") || "Підтримуваних моделей"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{totalBrands}</div>
                <div className="text-sm text-muted-foreground">{t("supportedBrands") || "Підтримуваних брендів"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{minPrice ? formatCurrency(minPrice) : "—"}</div>
                <div className="text-sm text-muted-foreground">{t("priceFrom") || "Ціна від"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary">{maxPrice ? formatCurrency(maxPrice) : "—"}</div>
                <div className="text-sm text-muted-foreground">{t("priceTo") || "Ціна до"}</div>
              </CardContent>
            </Card>
          </div>

          {/* Особливості послуги */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">{t("serviceFeatures") || "Особливості послуги"}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">{t("warranty") || "Гарантія"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("warrantyDescription") || "Надаємо гарантію на всі виконані роботи"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">{t("fastService") || "Швидко"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("fastServiceDescription") || "Виконуємо роботи в найкоротші терміни"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                    <Star className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">{t("quality") || "Якість"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("qualityDescription") || "Використовуємо тільки оригінальні запчастини"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Підтримувані моделі */}
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">{t("supportedModels") || "Підтримувані моделі"}</h2>

            {Object.entries(brandGroups).map(([brandName, group]: [string, any]) => (
              <div key={brandName} className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  {group.brand?.logo_url && (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full">
                      <img
                        src={formatImageUrl(group.brand.logo_url) || "/placeholder.svg"}
                        alt={brandName}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold">{brandName}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({group.models.length} {t("models") || "моделей"})
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.models.map((modelService: any) => (
                    <Card key={modelService.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                            <img
                              src={
                                formatImageUrl(modelService.models?.image_url) ||
                                "/placeholder.svg?height=48&width=48&query=phone"
                              }
                              alt={modelService.models?.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{modelService.models?.name}</h4>
                            <div className="text-sm font-semibold text-primary">
                              {modelService.price ? formatCurrency(modelService.price) : t("priceOnRequest")}
                            </div>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/${locale}/models/${modelService.models?.slug || modelService.models?.id}`}>
                              {commonT("view") || "Переглянути"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA секція */}
          <div className="text-center">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8">
                <h2 className="mb-4 text-2xl font-bold">{t("readyToOrder") || "Готові замовити?"}</h2>
                <p className="mb-6 text-muted-foreground">
                  {t("contactUsDescription") ||
                    "Зв'яжіться з нами для отримання детальної консультації та запису на ремонт"}
                </p>
                <Button size="lg" asChild>
                  <Link href={`/${locale}/contact?service=${encodeURIComponent(translation.name)}`}>
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
    console.error("Error in ServicePage:", error)
    return (
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold text-red-600">Помилка завантаження</h1>
          <p className="text-muted-foreground">Не вдалося завантажити дані послуги. Спробуйте пізніше.</p>
        </div>
      </div>
    )
  }
}
