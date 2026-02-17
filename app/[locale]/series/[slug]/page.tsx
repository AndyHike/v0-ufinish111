import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, Smartphone } from "lucide-react"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import SeriesPageClient from "./series-page-client"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: {
    locale: string
    slug: string
  }
}

// Pre-render popular series at build time
export async function generateStaticParams() {
  // Use public client for build-time static generation
  const supabase = createClient()
  
  try {
    const { data: seriesList } = await supabase
      .from("series")
      .select("slug")
      .order("position", { ascending: true })
      .limit(50) // Pre-render top 50 series
    
    const locales = ["cs", "uk", "en"]
    
    return (
      seriesList?.flatMap((series) =>
        locales.map((locale) => ({
          locale,
          slug: series.slug,
        }))
      ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (series):", error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: series } = await supabase.from("series").select("*, brands(name)").eq("slug", slug).single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!series) {
    const { data } = await supabase.from("series").select("*, brands(name)").eq("id", slug).single()
    series = data
  }

  if (!series) {
    const titlePatterns = {
      cs: "Série nenalezena | DeviceHelp",
      en: "Series not found | DeviceHelp",
      uk: "Серію не знайдено | DeviceHelp",
    }

    const descriptionPatterns = {
      cs: "Požadovaná série zařízení nebyla nalezena.",
      en: "The requested device series could not be found.",
      uk: "Запитувану серію пристроїв не вдалося знайти.",
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    }
  }

  const titlePatterns = {
    cs: `Oprava zařízení ${series.name} ${series.brands?.name} | DeviceHelp`,
    en: `Repair of ${series.name} ${series.brands?.name} devices | DeviceHelp`,
    uk: `Ремонт пристроїв ${series.name} ${series.brands?.name} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava všech modelů ${series.name} od ${series.brands?.name}. Rychlé a kvalitní služby s garancí.`,
    en: `Professional repair of all ${series.name} models from ${series.brands?.name}. Fast and quality services with warranty.`,
    uk: `Професійний ремонт усіх моделей ${series.name} від ${series.brands?.name}. Швидкі та якісні послуги з гарантією.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function SeriesPage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Series" })

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*, brands(id, name, slug, logo_url)")
    .eq("slug", slug)
    .single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!series) {
    const { data, error } = await supabase
      .from("series")
      .select("*, brands(id, name, slug, logo_url)")
      .eq("id", slug)
      .single()

    series = data
    seriesError = error
  }

  if (seriesError || !series) {
    notFound()
  }

  // Fetch models for this series
  const { data: models, error: modelsError } = await supabase
    .from("models")
    .select("id, name, slug, image_url, created_at")
    .eq("series_id", series.id)
    .order("position", { ascending: true })

  const initialData = {
    series,
    models: models || [],
  }

  return <SeriesPageClient initialData={initialData} locale={locale} slug={slug} />
}
