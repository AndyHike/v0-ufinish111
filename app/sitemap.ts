import type { MetadataRoute } from "next"
import { createServerClient } from "@/utils/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://devicehelp.cz"
  const locales = ["uk", "cs", "en"] as const
  const defaultLocale = "uk"

  const supabase = await createServerClient()
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Helper function to create sitemap entry with hreflang alternates
  function createSitemapEntry(path: string, lastModified?: Date): MetadataRoute.Sitemap[0] {
    const alternates: Record<string, string> = {}

    // Add all language versions
    locales.forEach((locale) => {
      alternates[locale] = `${baseUrl}/${locale}${path}`
    })

    // Add x-default pointing to default locale
    alternates["x-default"] = `${baseUrl}/${defaultLocale}${path}`

    return {
      url: `${baseUrl}/${defaultLocale}${path}`,
      lastModified: lastModified || new Date(),
      alternates: {
        languages: alternates,
      },
    }
  }

  // Helper function to add entries for all locales
  function addMultilingualEntries(path: string, lastModified?: Date) {
    locales.forEach((locale) => {
      const alternates: Record<string, string> = {}

      // Add all language versions
      locales.forEach((altLocale) => {
        alternates[altLocale] = `${baseUrl}/${altLocale}${path}`
      })

      // Add x-default pointing to default locale
      alternates["x-default"] = `${baseUrl}/${defaultLocale}${path}`

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: lastModified || new Date(),
        alternates: {
          languages: alternates,
        },
      })
    })
  }

  try {
    // Add homepage
    addMultilingualEntries("")

    // Static pages
    // Only include pages that actually exist as routes
    const staticPages = ["/contact", "/brands"]

    staticPages.forEach((page) => {
      addMultilingualEntries(page)
    })

    // Fetch and add dynamic brand pages
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("slug, updated_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Brands fetched:", { count: brands?.length, error: brandsError?.message })
    if (!brandsError && brands) {
      brands.forEach((brand) => {
        if (brand.slug) {
          addMultilingualEntries(`/brands/${brand.slug}`, brand.updated_at ? new Date(brand.updated_at) : new Date())
        }
      })
    } else if (brandsError) {
      console.warn("[SITEMAP] Error fetching brands:", brandsError.message)
    }

    // Fetch and add dynamic series pages
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

    // Fetch and add dynamic model pages
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

    // Fetch services and all their model combinations in two queries (no N+1)
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, slug, created_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Services fetched:", { count: services?.length, error: servicesError?.message })
    if (!servicesError && services) {
      // Add basic service pages
      services.forEach((service) => {
        if (service.slug) {
          addMultilingualEntries(
            `/services/${service.slug}`,
            service.created_at ? new Date(service.created_at) : new Date()
          )
        }
      })

      // Single query for ALL service+model combinations (no N+1)
      const serviceIds = services.map((s) => s.id)
      const { data: allModelServices, error: msError } = await supabase
        .from("model_services")
        .select("service_id, models(slug), services(slug, created_at)")
        .in("service_id", serviceIds)
        .not("models.slug", "is", null)

      if (!msError && allModelServices) {
        console.log(`[SITEMAP] Found ${allModelServices.length} service+model combinations`)
        allModelServices.forEach((ms) => {
          const model = (ms.models as unknown) as { slug: string } | null
          const service = (ms.services as unknown) as { slug: string; created_at: string } | null
          if (model?.slug && service?.slug) {
            addMultilingualEntries(
              `/services/${service.slug}/${model.slug}`,
              service.created_at ? new Date(service.created_at) : new Date()
            )
          }
        })
      } else if (msError) {
        console.warn("[SITEMAP] Error fetching model services:", msError.message)
      }
    } else if (servicesError) {
      console.warn("[SITEMAP] Error fetching services:", servicesError.message)
    }

    // Add articles hub pages
    addMultilingualEntries("/articles")

    // Fetch and add dynamic article pages with localized slugs
    const { data: articleTranslations, error: articlesError } = await supabase
      .from("article_translations")
      .select("slug, locale, updated_at, articles(updated_at, published)")
      .eq("articles.published", true)
      .not("slug", "is", null)

    console.log("[SITEMAP] Article translations fetched:", { count: articleTranslations?.length, error: articlesError?.message })
    if (!articlesError && articleTranslations) {
      // For each unique article, create sitemap entries with proper hreflang alternates
      const processedArticles = new Set<string>()

      articleTranslations.forEach((trans: any) => {
        const articleId = trans.article_id
        if (processedArticles.has(articleId)) return

        // Get all translations for this article to build proper alternates
        const allTranslations = articleTranslations.filter((t: any) => t.article_id === articleId)

        const alternates: Record<string, string> = {}
        allTranslations.forEach((t: any) => {
          alternates[t.locale] = `${baseUrl}/${t.locale}/articles/${t.slug}`
        })
        alternates["x-default"] = `${baseUrl}/${defaultLocale}/articles/${allTranslations.find((t: any) => t.locale === defaultLocale)?.slug || allTranslations[0].slug}`

        // Add one entry per locale for this article
        allTranslations.forEach((trans: any) => {
          sitemapEntries.push({
            url: `${baseUrl}/${trans.locale}/articles/${trans.slug}`,
            lastModified: trans.updated_at ? new Date(trans.updated_at) : new Date(),
            alternates: {
              languages: alternates,
            },
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
