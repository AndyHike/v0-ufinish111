import type { MetadataRoute } from "next"
import { createServerClient } from "@/utils/supabase/server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://devicehelp.cz"
  const locales = ["cs", "en", "uk"] as const
  const defaultLocale = "cs"

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
    const staticPages = ["/contact", "/about", "/services", "/pricing", "/privacy", "/terms", "/brands"]

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

    // Fetch and add dynamic service pages with model combinations
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, slug, created_at")
      .not("slug", "is", null)

    console.log("[SITEMAP] Services fetched:", { count: services?.length, error: servicesError?.message })
    if (!servicesError && services) {
      // First add basic service pages without model filter
      services.forEach((service) => {
        if (service.slug) {
          addMultilingualEntries(
            `/services/${service.slug}`,
            service.created_at ? new Date(service.created_at) : new Date()
          )
        }
      })

      // Then add service+model combinations
      for (const service of services) {
        if (!service.slug) continue

        const { data: modelServices, error: modelServicesError } = await supabase
          .from("model_services")
          .select("model_id, models(slug)")
          .eq("service_id", service.id)
          .not("models.slug", "is", null)

        if (!modelServicesError && modelServices) {
          console.log(`[SITEMAP] Found ${modelServices.length} models for service "${service.slug}"`)
          modelServices.forEach((ms) => {
            const model = ms.models as { slug: string } | null
            if (model?.slug) {
              addMultilingualEntries(
                `/services/${service.slug}?model=${model.slug}`,
                service.created_at ? new Date(service.created_at) : new Date()
              )
            }
          })
        }
      }
    } else if (servicesError) {
      console.warn("[SITEMAP] Error fetching services:", servicesError.message)
    }

    // Add articles hub pages
    addMultilingualEntries("/articles")

    // Fetch and add dynamic article pages
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("published", true)
      .not("slug", "is", null)

    console.log("[SITEMAP] Articles fetched:", { count: articles?.length, error: articlesError?.message })
    if (!articlesError && articles) {
      articles.forEach((article) => {
        if (article.slug) {
          addMultilingualEntries(
            `/articles/${article.slug}`,
            article.updated_at ? new Date(article.updated_at) : new Date()
          )
        }
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
