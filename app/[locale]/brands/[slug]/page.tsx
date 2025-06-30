import type { Metadata } from "next"
import { createServerClient } from "@/utils/supabase/server"
import BrandPageClient from "./BrandPageClient"

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
  return <BrandPageClient params={params} />
}
