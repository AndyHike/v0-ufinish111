import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { getB2BSitemapEntries } from "@/lib/seo/b2b-sitemap"
import { getMainSitemapEntries } from "@/lib/seo/main-sitemap"
import { getShopSitemapEntries } from "@/lib/seo/shop-sitemap"
import { createSitemapXml } from "@/lib/seo/sitemap-xml"
import { getShopSeoUrls } from "@/lib/shop/data"
import { isShopHost } from "@/lib/shop-routing"

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const entries = isShopHost(host)
    ? getShopSitemapEntries(await getShopSeoUrls())
    : isB2BHost(host)
      ? getB2BSitemapEntries()
      : await getMainSitemapEntries()

  return new Response(createSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
