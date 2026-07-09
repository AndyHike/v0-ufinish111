import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { getB2BSitemapEntries } from "@/lib/seo/b2b-sitemap"
import { getMainSitemapIndexEntries } from "@/lib/seo/main-sitemap"
import { getShopSitemapEntries } from "@/lib/seo/shop-sitemap"
import { createSitemapIndexXml, createSitemapXml } from "@/lib/seo/sitemap-xml"
import { getShopSeoUrls } from "@/lib/shop/data"
import { isShopHost } from "@/lib/shop-routing"

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
}

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  // Shop and b2b subdomains keep their small single-file sitemaps.
  if (isShopHost(host)) {
    return new Response(createSitemapXml(getShopSitemapEntries(await getShopSeoUrls())), { headers: XML_HEADERS })
  }
  if (isB2BHost(host)) {
    return new Response(createSitemapXml(getB2BSitemapEntries()), { headers: XML_HEADERS })
  }

  // Main site: a sitemap INDEX of per-page-type segments (see
  // app/sitemaps/[segment]/route.ts) so GSC reports coverage per segment.
  return new Response(createSitemapIndexXml(getMainSitemapIndexEntries()), { headers: XML_HEADERS })
}
