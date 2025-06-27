import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createServerClient } from "@/utils/supabase/server"
import { ChevronRight, Smartphone } from "lucide-react"
import { formatImageUrl } from "@/utils/image-url"
import { locales } from "@/i18n"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Brands" })
  const supabase = createServerClient()

  let { data: brand } = await supabase.from("brands").select("id, slug, name").eq("slug", slug).single()
  if (!brand) {
    const { data } = await supabase.from("brands").select("id, slug, name").eq("id", slug).single()
    brand = data
  }

  if (!brand) {
    return {
      title: t("brandNotFound"),
      description: t("brandNotFoundDesc"),
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"
  const path = `/brands/${brand.slug || brand.id}`

  const languages: { [key: string]: string } = {}
  locales.forEach((lang) => {
    languages[lang] = `${baseUrl}/${lang}${path}`
  })

  return {
    title: `${brand.name} - ${t("repairServices")}`,
    description: t("brandPageDescription", { brand: brand.name }),
    alternates: {
      canonical: `${baseUrl}/${locale}${path}`,
      languages: languages,
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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Заголовок бренду */}
        <div className="mb-12 flex flex-col items-center gap-6 rounded-xl bg-white p-8 shadow-sm md:flex-row">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-slate-50 p-4">
            <img
              src={formatImageUrl(brand.logo_url) || "/placeholder.svg?height=128&width=128&query=phone+brand+logo"}
              alt={brand.name}
              width={128}
              height={128}
              className="object-contain w-full h-full"
              style={{ display: "block" }}
            />
          </div>
          <div>
            <h1 className="text-center text-3xl font-bold tracking-tight md:text-left md:text-4xl">{brand.name}</h1>
            <p className="mt-3 max-w-[900px] text-center text-muted-foreground md:text-left">
              {t("brandPageDescription", { brand: brand.name })}
            </p>
          </div>
        </div>

        {/* Розділ серій */}
        {brand.series && brand.series.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-8 inline-block border-b-2 border-primary pb-2 text-2xl font-bold">
              {t("productLines") || "Лінійки продуктів"}
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {brand.series.map((series) => (
                <Link
                  key={series.id}
                  href={`/${locale}/series/${series.slug || series.id}`}
                  className="group relative overflow-hidden rounded-lg bg-white p-5 shadow-md transition-all hover:shadow-lg"
                >
                  {/* Декоративна лінія зліва */}
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-primary"></div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-medium text-slate-800 group-hover:text-primary">{series.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{t("viewAllModels") || "Переглянути всі моделі"}</p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Розділ моделей без серії - показуємо тільки якщо є моделі */}
        {hasModelsWithoutSeries && (
          <div>
            <h2 className="mb-6 inline-block border-b-2 border-primary pb-2 text-2xl font-bold">
              {brand.series && brand.series.length > 0
                ? t("otherModels") || "Інші моделі"
                : t("availableModels") || "Доступні моделі"}
            </h2>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {modelsWithoutSeries.map((model) => (
                <Link
                  href={`/${locale}/models/${model.slug || model.id}`}
                  key={model.id}
                  className="group flex flex-col items-center rounded-lg bg-white p-4 shadow-sm hover:shadow"
                >
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-slate-50 p-2 sm:h-24 sm:w-24">
                    {model.image_url ? (
                      <img
                        src={formatImageUrl(model.image_url) || "/placeholder.svg"}
                        alt={model.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-contain"
                        style={{ display: "block" }}
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
          </div>
        )}

        {/* Якщо немає ні серій, ні моделей без серій, показуємо повідомлення */}
        {(!brand.series || brand.series.length === 0) && !hasModelsWithoutSeries && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-muted-foreground">{t("noModelsAvailable", { brand: brand.name })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
