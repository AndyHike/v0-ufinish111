import type { SitemapEntry } from "@/lib/seo/sitemap-xml"
import { mainSiteUrl } from "@/lib/site-config"
import { createServerClient } from "@/utils/supabase/server"

const locales = ["uk", "cs", "en"] as const
const defaultLocale = "cs"

// Bump this whenever the service / service+model page templates or structured data change.
// It lifts the stale `created_at` lastmod of catalog pages so search engines re-crawl them.
const CONTENT_REVISION = new Date("2026-06-16")

function mostRecentDate(...dates: Array<Date | null | undefined>): Date {
  const valid = dates.filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()))
  return valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : new Date()
}

export async function getMainSitemapEntries(): Promise<SitemapEntry[]> {
  const baseUrl = mainSiteUrl
  const supabase = await createServerClient()
  const sitemapEntries: SitemapEntry[] = []

  function addMultilingualEntries(path: string, lastModified?: Date) {
    locales.forEach((locale) => {
      const alternates: Record<string, string> = {}

      locales.forEach((altLocale) => {
        alternates[altLocale] = `${baseUrl}/${altLocale}${path}`
      })

      alternates["x-default"] = `${baseUrl}/${defaultLocale}${path}`

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: lastModified ?? new Date(),
        alternates,
      })
    })
  }

  try {
    addMultilingualEntries("")
    ;["/contact", "/brands"].forEach((page) => addMultilingualEntries(page))

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("slug, updated_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Brands fetched:", { count: brands?.length, error: brandsError?.message })
    if (!brandsError && brands) {
      brands.forEach((brand) => {
        if (brand.slug) {
          addMultilingualEntries(
            `/brands/${brand.slug.toLowerCase()}`,
            brand.updated_at ? new Date(brand.updated_at) : new Date(),
          )
        }
      })
    } else if (brandsError) {
      console.warn("[SITEMAP] Error fetching brands:", brandsError.message)
    }

    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select("slug, updated_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Series fetched:", { count: series?.length, error: seriesError?.message })
    if (!seriesError && series) {
      series.forEach((serie) => {
        if (serie.slug) {
          addMultilingualEntries(`/series/${serie.slug}`, serie.updated_at ? new Date(serie.updated_at) : new Date())
        }
      })
    } else if (seriesError) {
      console.warn("[SITEMAP] Error fetching series:", seriesError.message)
    }

    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("slug, updated_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Models fetched:", { count: models?.length, error: modelsError?.message })
    if (!modelsError && models) {
      models.forEach((model) => {
        if (model.slug) {
          addMultilingualEntries(`/models/${model.slug}`, model.updated_at ? new Date(model.updated_at) : new Date())
        }
      })
    } else if (modelsError) {
      console.warn("[SITEMAP] Error fetching models:", modelsError.message)
    }

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, slug, created_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Services fetched:", { count: services?.length, error: servicesError?.message })
    if (!servicesError && services) {
      services.forEach((service) => {
        if (service.slug) {
          addMultilingualEntries(
            `/services/${service.slug}`,
            mostRecentDate(service.created_at ? new Date(service.created_at) : null, CONTENT_REVISION),
          )
        }
      })

      const serviceIds = services.map((service) => service.id)
      const { data: allModelServices, error: modelServicesError } = await supabase
        .from("model_services")
        .select("service_id, models(slug), services(slug, created_at)")
        .in("service_id", serviceIds)
        .not("models.slug", "is", null)

      if (!modelServicesError && allModelServices) {
        console.log(`[SITEMAP] Found ${allModelServices.length} service+model combinations`)
        allModelServices.forEach((modelService) => {
          const model = modelService.models as unknown as { slug: string } | null
          const service = modelService.services as unknown as { slug: string; created_at: string } | null

          if (model?.slug && service?.slug) {
            addMultilingualEntries(
              `/services/${service.slug}/${model.slug}`,
              mostRecentDate(service.created_at ? new Date(service.created_at) : null, CONTENT_REVISION),
            )
          }
        })
      } else if (modelServicesError) {
        console.warn("[SITEMAP] Error fetching model services:", modelServicesError.message)
      }
    } else if (servicesError) {
      console.warn("[SITEMAP] Error fetching services:", servicesError.message)
    }

    addMultilingualEntries("/articles")

    const { data: articleTranslations, error: articlesError } = await supabase
      .from("article_translations")
      .select("article_id, slug, locale, updated_at, articles(updated_at, published)")
      .eq("articles.published", true)
      .not("slug", "is", null)

    console.log("[SITEMAP] Article translations fetched:", {
      count: articleTranslations?.length,
      error: articlesError?.message,
    })

    if (!articlesError && articleTranslations) {
      const processedArticles = new Set<string>()

      articleTranslations.forEach((translation: any) => {
        const articleId = translation.article_id
        if (processedArticles.has(articleId)) return

        const allTranslations = articleTranslations.filter((item: any) => item.article_id === articleId)
        const alternates: Record<string, string> = {}

        allTranslations.forEach((item: any) => {
          alternates[item.locale] = `${baseUrl}/${item.locale}/articles/${item.slug}`
        })

        alternates["x-default"] =
          `${baseUrl}/${defaultLocale}/articles/${allTranslations.find((item: any) => item.locale === defaultLocale)?.slug || allTranslations[0].slug}`

        allTranslations.forEach((item: any) => {
          sitemapEntries.push({
            url: `${baseUrl}/${item.locale}/articles/${item.slug}`,
            lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
            alternates,
          })
        })

        processedArticles.add(articleId)
      })
    } else if (articlesError) {
      console.warn("[SITEMAP] Error fetching articles:", articlesError.message)
    }

    console.log(`[SITEMAP] Generated sitemap with ${sitemapEntries.length} entries`)
  } catch (error) {
    console.error("Error generating sitemap:", error)
  }

  return sitemapEntries
}
