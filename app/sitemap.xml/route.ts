import { createServerClient } from "@/utils/supabase/server"
import { locales } from "@/i18n"

const URL = process.env.NEXT_PUBLIC_APP_URL || "https://devicehelp.cz"

function generateUrlEntry(path: string, lastmod: string) {
  const urlEntries = locales
    .map((locale) => {
      const loc = `${URL}/${locale}${path === "/" ? "" : path}`

      const xhtmlLinks = locales
        .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${URL}/${l}${path === "/" ? "" : path}"/>`)
        .join("\n      ")

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="x-default" href="${URL}/cs${path === "/" ? "" : path}"/>
    ${xhtmlLinks}
  </url>`
    })
    .join("")

  return urlEntries
}

export async function GET() {
  const supabase = createServerClient()
  const today = new Date().toISOString()

  const staticPaths = ["/", "/contact", "/pricing", "/services", "/terms", "/privacy", "/brands"]

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`

  // Static pages
  staticPaths.forEach((path) => {
    sitemap += generateUrlEntry(path, today)
  })

  // Dynamic pages: Brands
  const { data: brands } = await supabase.from("brands").select("slug, id, updated_at")
  brands?.forEach((brand) => {
    const path = `/brands/${brand.slug || brand.id}`
    const lastmod = brand.updated_at ? new Date(brand.updated_at).toISOString() : today
    sitemap += generateUrlEntry(path, lastmod)
  })

  // Dynamic pages: Series
  const { data: seriesList } = await supabase.from("series").select("slug, id, updated_at")
  seriesList?.forEach((series) => {
    const path = `/series/${series.slug || series.id}`
    const lastmod = series.updated_at ? new Date(series.updated_at).toISOString() : today
    sitemap += generateUrlEntry(path, lastmod)
  })

  // Dynamic pages: Models
  const { data: models } = await supabase.from("models").select("slug, id, updated_at")
  models?.forEach((model) => {
    const path = `/models/${model.slug || model.id}`
    const lastmod = model.updated_at ? new Date(model.updated_at).toISOString() : today
    sitemap += generateUrlEntry(path, lastmod)
  })

  sitemap += `
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
