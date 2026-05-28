export interface SitemapEntry {
  url: string
  lastModified?: Date
  alternates?: Record<string, string>
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export function createSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified ?? new Date()
      const alternates = Object.entries(entry.alternates ?? {})
        .map(
          ([locale, href]) =>
            `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
        )
        .join("")

      return `<url><loc>${escapeXml(entry.url)}</loc><lastmod>${lastModified.toISOString()}</lastmod>${alternates}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
}
