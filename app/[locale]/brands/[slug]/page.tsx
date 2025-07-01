import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { createCachedSupabaseClient } from "@/lib/cache/supabase-cache"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params

  const cachedSupabase = createCachedSupabaseClient()
  const brand = await cachedSupabase.getBrandBySlug(slug)

  if (!brand) {
    return {
      title: "Brand Not Found | DeviceHelp",
    }
  }

  const titlePatterns = {
    cs: `${brand.name} oprava | DeviceHelp`,
    en: `${brand.name} repair | DeviceHelp`,
    uk: `Ремонт ${brand.name} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava ${brand.name} zařízení. Rychlá a kvalitní oprava s zárukou.`,
    en: `Professional ${brand.name} device repair. Fast and quality repair with warranty.`,
    uk: `Професійний ремонт пристроїв ${brand.name}. Швидкий та якісний ремонт з гарантією.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function BrandPage({ params }: Props) {
  const { locale, slug } = params
  const t = await getTranslations({ locale, namespace: "Brands" })

  const cachedSupabase = createCachedSupabaseClient()

  // Використовуємо кешовані запити
  const brand = await cachedSupabase.getBrandBySlug(slug)

  if (!brand) {
    notFound()
  }

  const series = await cachedSupabase.getSeriesByBrandId(brand.id)

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Навігація */}
        <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}`} className="hover:text-primary">
            {t("home") || "Головна"}
          </Link>
          <span>/</span>
          <Link href={`/${locale}/brands`} className="hover:text-primary">
            {t("brands") || "Бренди"}
          </Link>
          <span>/</span>
          <span className="text-foreground">{brand.name}</span>
        </div>

        {/* Кнопка повернення */}
        <Link
          href={`/${locale}/brands`}
          className="mb-8 inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBrands") || "До брендів"}
        </Link>

        {/* Заголовок бренду */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-50 p-4">
              <img
                src={formatImageUrl(brand.logo_url) || "/placeholder.svg?height=96&width=96&query=brand+logo"}
                alt={brand.name}
                width={96}
                height={96}
                className="h-full w-full object-contain"
                style={{ display: "block" }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{brand.name}</h1>
          {brand.description && <p className="mt-3 text-muted-foreground">{brand.description}</p>}
        </div>

        {/* Серії */}
        {series && series.length > 0 ? (
          <div>
            <h2 className="mb-8 text-2xl font-semibold">{t("series") || "Серії"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {series.map((serie) => (
                <Link
                  key={serie.id}
                  href={`/${locale}/series/${serie.slug || serie.id}`}
                  className="group rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <h3 className="font-medium group-hover:text-primary">{serie.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-muted-foreground">{t("noSeriesAvailable") || "Серії недоступні для цього бренду"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
