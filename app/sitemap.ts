import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.devicehelp.cz"
  const locales = ["cs", "en", "uk"] as const
  const defaultLocale = "cs"

  const supabase = createClient()
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

    if (!brandsError && brands) {
      brands.forEach((brand) => {
        if (brand.slug) {
          addMultilingualEntries(`/brands/${brand.slug}`, brand.updated_at ? new Date(brand.updated_at) : new Date())
        }
      })
    }

    // Fetch and add dynamic series pages
    const { data: series, error: seriesError } = await supabase
      .from("series")
      .select("slug, updated_at")
      .not("slug", "is", null)

    if (!seriesError && series) {
      series.forEach((serie) => {
        if (serie.slug) {
          addMultilingualEntries(`/series/${serie.slug}`, serie.updated_at ? new Date(serie.updated_at) : new Date())
        }
      })
    }

    // Fetch and add dynamic model pages
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("slug, updated_at")
      .not("slug", "is", null)

    if (!modelsError && models) {
      models.forEach((model) => {
        if (model.slug) {
          addMultilingualEntries(`/models/${model.slug}`, model.updated_at ? new Date(model.updated_at) : new Date())
        }
      })
    }

    console.log(`Generated sitemap with ${sitemapEntries.length} entries`)
  } catch (error) {
    console.error("Error generating sitemap:", error)
  }

  return sitemapEntries
}
