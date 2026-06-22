import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
// import { createServerClient } removed
import { createClient } from "@/utils/supabase/client"
import { ChevronRight, Smartphone, ArrowLeft } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { Breadcrumb } from "@/components/breadcrumb"
import BrandPageClient from "./brand-page-client"
import { toOGLocale } from "@/lib/og-locale"
import { siteUrl } from "@/lib/site-config"
import { generateBreadcrumbListSchema } from "@/lib/structured-data"
import { PrevNextNav } from "@/components/prev-next-nav"
import { BrandSeoSections } from "@/components/brand-seo-sections"
import { ContactCTABanner } from "@/components/contact-cta-banner"


// ISR Configuration
export const revalidate = 3600 // Regenerate every 1 hour
export const dynamicParams = true // Allow new slugs on-the-fly

type Props = {
  params: Promise<{
    locale: string
    slug: string
  }>
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

    const locales = ["uk", "cs", "en"]

    return (
      brands
        ?.filter((brand) => typeof brand.slug === 'string' && brand.slug.trim() !== '')
        .flatMap((brand) =>
          locales.map((locale) => ({
            locale,
            slug: brand.slug.toLowerCase(),
          }))
        ) || []
    )
  } catch (error) {
    console.error("[v0] Error in generateStaticParams (brands):", error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params

  const supabase = createClient()

  // First try to find by slug
  let { data: brand } = await supabase.from("brands").select("*").ilike("slug", slug).single()

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
  const canonicalSlug = String(brand.slug || slug).toLowerCase()

  const metadata = {
    cs: {
      title: `Oprava ${brandName} Praha 6 | Servis mobilů | DeviceHelp`,
      description: `Profesionální oprava mobilních telefonů ${brandName} v Praze 6 na Břevnově. Všechny modely ${brandName}, záruka 6 měsíců, oprava 2-3 hodiny. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `oprava ${brandName} Praha 6, servis ${brandName} Břevnov, oprava mobilu ${brandName}, servis telefonu Bělohorská, ${brandName} Praha6`,
    },
    en: {
      title: `${brandName} Repair Prague 6 | Phone Service | DeviceHelp`,
      description: `Professional ${brandName} mobile phone repair in Prague 6 Břevnov. All ${brandName} models, 6 month warranty, 2-3 hours service. Bělohorská 209/133. ☎ +420 775 848 259`,
      keywords: `${brandName} repair Prague 6, ${brandName} service Břevnov, ${brandName} mobile repair, phone service Bělohorská`,
    },
    uk: {
      title: `Ремонт ${brandName} Прага 6 | Сервіс | DeviceHelp`,
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
      locale: toOGLocale(locale),
      url: `${siteUrl}/${locale}/brands/${canonicalSlug}`,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/brands/${canonicalSlug}`,
      languages: {
        cs: `${siteUrl}/cs/brands/${canonicalSlug}`,
        en: `${siteUrl}/en/brands/${canonicalSlug}`,
        uk: `${siteUrl}/uk/brands/${canonicalSlug}`,
        "x-default": `${siteUrl}/cs/brands/${canonicalSlug}`,
      },
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
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: "Brands" })

  const supabase = createClient()

  // Спочатку спробуємо знайти за слагом
  let { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*, series(id, name, slug, position)")
    .ilike("slug", slug)
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

  const canonicalSlug = String(brand.slug || slug).toLowerCase()
  if (slug !== canonicalSlug) {
    permanentRedirect(`/${locale}/brands/${canonicalSlug}`)
  }

  // Сортуємо серії на стороні сервера
  if (brand?.series) {
    brand.series = (brand.series as any[]).sort((a, b) => {
      const aPos = a.position || 999
      const bPos = b.position || 999
      return aPos - bPos
    })
  }

  // Series photos live in the `image_url` column added by
  // scripts/add_image_url_to_series.sql. Fetch them in a separate, tolerant
  // query so the brand page keeps rendering even before that migration runs
  // (a missing column just yields no data → series render without a photo).
  if (brand?.series?.length) {
    const { data: seriesImages } = await supabase
      .from("series")
      .select("id, image_url")
      .eq("brand_id", brand.id)

    if (seriesImages) {
      const imageById = new Map(seriesImages.map((s: any) => [s.id, s.image_url]))
      brand.series = (brand.series as any[]).map((s) => ({
        ...s,
        image_url: imageById.get(s.id) ?? null,
      }))
    }
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

  // Fetch all brands for prev/next navigation
  const { data: allBrands } = await supabase
    .from("brands")
    .select("name, slug")
    .order("position", { ascending: true })

  const brandIndex = allBrands?.findIndex((b) => String(b.slug || "").toLowerCase() === canonicalSlug) ?? -1
  const prevBrand = brandIndex > 0 ? allBrands![brandIndex - 1] : null
  const nextBrand = allBrands && brandIndex >= 0 && brandIndex < allBrands.length - 1 ? allBrands[brandIndex + 1] : null

  // Fetch popular services with min prices for BrandSeoSections
  const { data: topServices } = await supabase
    .from("services")
    .select(`id, slug, position, services_translations(name, locale), model_services(price)`)
    .order("position", { ascending: true })
    .limit(6)

  const seoServices = (topServices || []).map((svc: any) => {
    const tr = (svc.services_translations as any[])?.find((t: any) => t.locale === locale) ?? svc.services_translations?.[0]
    const prices = (svc.model_services as any[])?.map((ms: any) => ms.price).filter((p: any) => p != null && p > 0)
    return {
      id: svc.id,
      slug: svc.slug,
      name: tr?.name ?? svc.slug,
      minPrice: prices && prices.length > 0 ? Math.min(...prices) : null,
    }
  })

  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: "DeviceHelp", url: `${siteUrl}/${locale}` },
    { name: t("allBrands") || "Brands", url: `${siteUrl}/${locale}/brands` },
    { name: brand.name, url: `${siteUrl}/${locale}/brands/${canonicalSlug}` },
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="order-1">
        <BrandPageClient initialData={initialData} locale={locale} slug={slug} />
      </div>

      <div className="order-2 w-full">
        <BrandSeoSections locale={locale} services={seoServices} />
      </div>

      <div className="order-3 container mx-auto px-4 pb-10 pt-4 w-full">
        <div className="mt-8 mb-8">
          <ContactCTABanner locale={locale} />
        </div>
        <div className="mt-8">
          <PrevNextNav
            prev={prevBrand ? { name: prevBrand.name, href: `/${locale}/brands/${String(prevBrand.slug).toLowerCase()}` } : null}
            next={nextBrand ? { name: nextBrand.name, href: `/${locale}/brands/${String(nextBrand.slug).toLowerCase()}` } : null}
            label="Navigate brands"
          />
        </div>
      </div>
    </div>
  )
}
