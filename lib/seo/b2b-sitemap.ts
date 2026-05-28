import type { SitemapEntry } from "@/lib/seo/sitemap-xml"
import { b2bSiteUrl } from "@/lib/site-config"

const locales = ["cs", "uk", "en"] as const
const paths = ["", "/faq"] as const

export function getB2BSitemapEntries(): SitemapEntry[] {
  const now = new Date()

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${b2bSiteUrl}/${locale}${path}`,
      lastModified: now,
      alternates: {
        cs: `${b2bSiteUrl}/cs${path}`,
        uk: `${b2bSiteUrl}/uk${path}`,
        en: `${b2bSiteUrl}/en${path}`,
        "x-default": `${b2bSiteUrl}/cs${path}`,
      },
    })),
  )
}
