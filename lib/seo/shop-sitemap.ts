import type { SitemapEntry } from "./sitemap-xml"
import { mockShopCategories, mockShopItems, SHOP_LOCALES } from "../shop/mock-data"
import { shopSiteUrl } from "../site-config"

function languageAlternates(path: string): Record<string, string> {
  const alternates = SHOP_LOCALES.reduce<Record<string, string>>((items, locale) => {
    items[locale] = `${shopSiteUrl}/${locale}${path}`
    return items
  }, {})

  alternates["x-default"] = `${shopSiteUrl}/cs${path}`
  return alternates
}

function localizedEntries(path: string, lastModified: Date): SitemapEntry[] {
  return SHOP_LOCALES.map((locale) => ({
    url: `${shopSiteUrl}/${locale}${path}`,
    lastModified,
    alternates: languageAlternates(path),
  }))
}

export function getShopSitemapEntries(): SitemapEntry[] {
  const now = new Date()
  const entries: SitemapEntry[] = [...localizedEntries("", now)]

  for (const category of mockShopCategories) {
    if (category.isActive) {
      entries.push(...localizedEntries(`/category/${category.slug}`, now))
    }
  }

  for (const item of mockShopItems) {
    entries.push(...localizedEntries(`/product/${item.slug}`, now))
  }

  return entries
}
