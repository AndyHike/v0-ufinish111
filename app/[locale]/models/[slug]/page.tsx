import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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

  const supabase = createClient()

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

  const supabase = createClient()

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

  // Fetch services for this model with translations
  const { data: modelServices, error: modelServicesError } = await supabase
    .from("model_services")
    .select(`
      id, 
      price, 
      model_id, 
      service_id, 
      services(
        id, 
        slug,
        position,
        services_translations(
          name,
          description,
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
          slug: modelService.services.slug,
          position: modelService.services.position,
          name: translations[0]?.name || "",
          description: translations[0]?.description || "",
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
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Кнопка повернення */}
        <Link
          href={backUrl}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {backText}
        </Link>

        <div className="mb-12 flex flex-col items-center gap-6 md:flex-row">
          <div className="relative h-40 w-40 overflow-hidden rounded-lg">
            <img
              src={formatImageUrl(model.image_url) || "/placeholder.svg?height=160&width=160&query=phone+model"}
              alt={model.name}
              width={160}
              height={160}
              className="h-full w-full object-contain"
              style={{ display: "block" }}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              {model.brands?.logo_url && (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <img
                    src={formatImageUrl(model.brands.logo_url) || "/placeholder.svg"}
                    alt={model.brands.name}
                    width={24}
                    height={24}
                    className="h-full w-full object-contain"
                    style={{ display: "block" }}
                  />
                </div>
              )}
              <span className="text-sm text-muted-foreground">{model.brands?.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{model.name}</h1>
            <p className="mt-2 max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("modelPageDescription", { model: model.name, brand: model.brands?.name })}
            </p>
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-bold">{t("availableServices") || "Доступні послуги"}</h2>

        {transformedModelServices && transformedModelServices.length > 0 ? (
          <div className="grid gap-4">
            {transformedModelServices.map((modelService) => (
              <div key={modelService.id} className="flex flex-col rounded-lg border p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium">{modelService.service.name}</h3>
                    <p className="mt-2 text-muted-foreground">{modelService.service.description}</p>
                  </div>
                  <div className="text-xl font-bold ml-4">
                    {modelService.price !== null ? formatCurrency(modelService.price) : t("priceOnRequest")}
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
                  {/* Кнопка для перегляду деталей послуги */}
                  <Button variant="outline" asChild>
                    <Link href={`/${locale}/services/${modelService.service.slug || modelService.service.id}`}>
                      Детальніше про послугу
                    </Link>
                  </Button>

                  {/* Кнопка для замовлення */}
                  <Button asChild>
                    <Link
                      href={`/${locale}/contact?service=${encodeURIComponent(modelService.service.name)}&model=${encodeURIComponent(model.name)}`}
                    >
                      {commonT("requestService") || "Замовити послугу"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>{t("noServicesAvailable") || "Послуги недоступні"}</p>
        )}
      </div>
    </div>
  )
}
