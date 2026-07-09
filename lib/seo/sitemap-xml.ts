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

export interface SitemapIndexEntry {
  url: string
  lastModified?: Date
}

/** Sitemap index (<sitemapindex>) pointing at segmented sitemap files. */
export function createSitemapIndexXml(files: SitemapIndexEntry[]): string {
  const items = files
    .map((file) => {
      const lastModified = file.lastModified ? `<lastmod>${file.lastModified.toISOString()}</lastmod>` : ""
      return `<sitemap><loc>${escapeXml(file.url)}</loc>${lastModified}</sitemap>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`
}

export function createSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      // Omit <lastmod> when the real modification date is unknown — a fake
      // "now" on every request is noise search engines learn to ignore.
      const lastModified = entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : ""
      const alternates = Object.entries(entry.alternates ?? {})
        .map(
          ([locale, href]) =>
            `<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`,
        )
        .join("")

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${alternates}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
}
