import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import BrandPageClient from "./brand-page-client"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  const supabase = createServerClient()

  // First try to find by slug
  let { data: brand } = await supabase.from("brands").select("*").eq("slug", slug).single()

  // If not found by slug, try to find by ID
  if (!brand) {
    const { data } = await supabase.from("brands").select("*").eq("id", slug).single()
    brand = data
  }

  if (!brand) {
    return {
      title: "Brand Not Found | DeviceHelp",
      description: "The requested brand could not be found.",
    }
  }

  // Language-specific title patterns
  const titlePatterns = {
    cs: `Oprava zařízení ${brand.name} | DeviceHelp`,
    en: `Repair of ${brand.name} devices | DeviceHelp`,
    uk: `Ремонт пристроїв ${brand.name} | DeviceHelp`,
  }

  // Language-specific descriptions
  const descriptionPatterns = {
    cs: `Profesionální oprava zařízení ${brand.name}. Rychlé a kvalitní služby pro všechny modely ${brand.name}.`,
    en: `Professional repair services for ${brand.name} devices. Fast and quality repairs for all ${brand.name} models.`,
    uk: `Професійний ремонт пристроїв ${brand.name}. Швидкі та якісні послуги для всіх моделей ${brand.name}.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Brands" })

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*, series(id, name, slug, position)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!brand) {
    const { data, error } = await supabase
      .from("brands")
      .select("*, series(id, name, slug, position)")
      .eq("id", slug)
      .single()

    brand = data
    brandError = error
  }

  if (brandError || !brand) {
    notFound()
  }

  // Оновимо запит до бази даних, щоб отримати моделі без серії
  const { data: modelsWithoutSeries, error: modelsError } = await supabase
    .from("models")
    .select("id, name, slug, image_url")
    .eq("brand_id", brand.id)
    .is("series_id", null)
    .order("position", { ascending: true })

  // Перевіряємо, чи є моделі без серії
  const hasModelsWithoutSeries = modelsWithoutSeries && modelsWithoutSeries.length > 0

  return (
    <BrandPageClient
      params={params}
      brand={brand}
      modelsWithoutSeries={modelsWithoutSeries || []}
      hasModelsWithoutSeries={hasModelsWithoutSeries}
    />
  )
}
