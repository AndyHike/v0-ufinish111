import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import ModelPageClient from "./model-page-client"

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
    <ModelPageClient
      params={params}
      model={model}
      transformedModelServices={transformedModelServices || []}
      t={t}
      commonT={commonT}
      backUrl={backUrl}
      backText={backText}
    />
  )
}
