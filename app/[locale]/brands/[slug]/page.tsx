import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/client"
import { ChevronRight, Smartphone, ArrowLeft } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { ContactCTABanner } from "@/components/contact-cta-banner"
import { Breadcrumb } from "@/components/breadcrumb"
import BrandPageClient from "./brand-page-client"

// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: {
    locale: string
    slug: string
  }
}

// Pre-render popular brands at build time
export async function generateStaticParams() {
  // Use public client for build-time static generation
  const supabase = createClient()
  
  try {
    const { data: brands } = await supabase
      .from("brands")
      .select("slug")
      .order("position", { ascending: true })
      .limit(50) // Pre-render top 50 brands
    
    const locales = ["cs", "uk", "en"]
    
    return (
      brands?.flatMap((brand) =>
        locales.map((locale) => ({
          locale,
          slug: brand.slug,
        }))
      ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (brands):", error)
    return []
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

  const brandName = brand.name

  const metadata = {
    cs: {
      title: `Oprava ${brandName} Praha 6 Břevnov | Servis mobilů ${brandName} | Záruka 6 měsíců`,
      description: `Profesionální oprava mobilních telefonů ${brandName} v Praze 6 na Břevnově. Všechny modely ${brandName}, záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `oprava ${brandName} Praha 6, servis ${brandName} Břevnov, oprava mobilu ${brandName}, servis telefonu Bělohorská, ${brandName} Praha6`,
    },
    en: {
      title: `${brandName} Repair Prague 6 Břevnov | ${brandName} Mobile Service | 6 Month Warranty`,
      description: `Professional ${brandName} mobile phone repair in Prague 6 Břevnov. All ${brandName} models, 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `${brandName} repair Prague 6, ${brandName} service Břevnov, ${brandName} mobile repair, phone service Bělohorská`,
    },
    uk: {
      title: `Ремонт ${brandName} Прага 6 Бржевнов | Сервіс мобільних ${brandName} | Гарантія 6 місяців`,
      description: `Професійний ремонт мобільних телефонів ${brandName} в Празі 6 Бржевнов. Всі моделі ${brandName}, гарантія 6 місяців, ремонт 2-3 години. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `ремонт ${brandName} Прага 6, сервіс ${brandName} Бржевнов, ремонт мобільного ${brandName}, сервіс телефону Белогорська`,
    },
  }

  const currentMetadata = metadata[locale as keyof typeof metadata] || metadata.en

  return {
    title: currentMetadata.title,
    description: currentMetadata.description,
    keywords: currentMetadata.keywords,
    openGraph: {
      title: currentMetadata.title,
      description: currentMetadata.description,
      type: "website",
      locale: locale,
    },
    twitter: {
      card: "summary",
      title: currentMetadata.title,
      description: currentMetadata.description,
    },
    other: {
      "seznam-wmt": "kEPWnFjKJyWrp9OtNNXIlOe6oNf9vfv4",
    },
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

  const initialData = {
    brand,
    modelsWithoutSeries: modelsWithoutSeries || [],
  }

  return <BrandPageClient initialData={initialData} locale={locale} slug={slug} />
}
