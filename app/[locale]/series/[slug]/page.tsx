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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: series.brands?.name || "Brand", href: `/${locale}/brands/${series.brands?.slug || series.brand_id}` },
              { label: series.name, href: `/${locale}/series/${series.slug}` },
            ]}
          />
        </div>

        {/* Заголовок серії */}
        <div className="mb-12 rounded-xl bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            {series.brands?.logo_url && (
              <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-slate-50 p-3 flex-shrink-0">
                <Image
                  src={series.brands.logo_url}
                  alt={series.brands.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-contain"
                  quality={80}
                  priority={true}
                />
              </div>
            )}
            <div>
              <h1 className="text-center text-3xl font-bold tracking-tight md:text-left md:text-4xl">{series.name}</h1>
              <p className="mt-3 max-w-[900px] text-center text-muted-foreground md:text-left">
                {t("seriesPageDescription", { series: series.name, brand: series.brands?.name })}
              </p>
            </div>
          </div>
        </div>

        {/* Розділ моделей */}
        <div>
          <h2 className="mb-6 border-b pb-2 text-2xl font-bold">{t("availableModels") || "Доступні моделі"}</h2>

          {models && models.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {models.map((model) => (
                <Link
                  key={model.id}
                  href={`/${locale}/models/${model.slug || model.id}`}
                  className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                >
                  <div className="mb-4 relative h-24 w-24 flex-shrink-0 rounded-lg bg-slate-50 p-2 sm:h-28 sm:w-28 overflow-hidden flex items-center justify-center">
                    {model.image_url ? (
                      <Image
                        src={model.image_url}
                        alt={model.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-contain"
                        quality={75}
                        priority={false}
                        sizes="(max-width: 640px) 96px, 112px"
                      />
                    ) : (
                      <Smartphone className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-center text-base font-medium group-hover:text-primary sm:text-lg">
                    {model.name}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-muted-foreground">{t("noModelsAvailable") || "Моделі недоступні"}</p>
            </div>
          )}
        </div>

        <ContactCTABanner locale={locale} />
      </div>
    </div>
  )
}
