import type { SitemapEntry } from "./sitemap-xml"
import type { ShopSeoUrlRecord } from "../shop/types"
import { shopSiteUrl } from "../site-config"

const SHOP_LOCALES = ["cs", "uk", "en"] as const
const DEFAULT_SHOP_LOCALE = "cs"

function isShopLocale(locale: string): boolean {
  return (SHOP_LOCALES as readonly string[]).includes(locale)
}

function homeEntries(): SitemapEntry[] {
  const alternates: Record<string, string> = {}
  for (const locale of SHOP_LOCALES) {
    alternates[locale] = `${shopSiteUrl}/${locale}`
  }
  alternates["x-default"] = `${shopSiteUrl}/${DEFAULT_SHOP_LOCALE}`

  return SHOP_LOCALES.map((locale) => ({ url: `${shopSiteUrl}/${locale}`, alternates }))
}

function parseLastModified(record: ShopSeoUrlRecord): Date | undefined {
  const raw = record.lastmod ?? record.updatedAt
  if (!raw) {
    return undefined
  }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Pure sitemap builder over the admin's `GET /seo/urls` feed (fetched by
 * `getShopSeoUrls` in lib/shop/data.ts). The feed is already filtered to
 * indexable resources and carries per-locale canonical URLs with real lastmod.
 * Records of the same entity (type + id) become hreflang alternates of each
 * other, with x-default pointing at the default-locale URL.
 */
export function getShopSitemapEntries(records: ShopSeoUrlRecord[]): SitemapEntry[] {
  const groups = new Map<string, ShopSeoUrlRecord[]>()
  for (const record of records) {
    if (!record?.canonicalUrl || !isShopLocale(record.locale)) {
      continue
    }
    const key = `${record.type}:${record.id}`
    const group = groups.get(key)
    if (group) {
      group.push(record)
    } else {
      groups.set(key, [record])
    }
  }

  const entries: SitemapEntry[] = homeEntries()
  const seenUrls = new Set(entries.map((entry) => entry.url))

  for (const group of groups.values()) {
    const alternates: Record<string, string> = {}
    for (const record of group) {
      alternates[record.locale] = record.canonicalUrl
    }
    const defaultUrl = alternates[DEFAULT_SHOP_LOCALE]
    if (defaultUrl) {
      alternates["x-default"] = defaultUrl
    }

    for (const record of group) {
      // Slug-less variants can share the parent item URL; emit each URL once.
      if (seenUrls.has(record.canonicalUrl)) {
        continue
      }
      seenUrls.add(record.canonicalUrl)
      entries.push({
        url: record.canonicalUrl,
        lastModified: parseLastModified(record),
        alternates,
      })
    }
  }

  return entries
}
