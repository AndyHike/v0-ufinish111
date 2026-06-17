import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { isShopHost } from "@/lib/shop-routing"
import { b2bSiteUrl, mainSiteUrl, shopSiteUrl } from "@/lib/site-config"

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const isB2B = isB2BHost(host)
  const isShop = isShopHost(host)
  const baseUrl = isShop ? shopSiteUrl : isB2B ? b2bSiteUrl : mainSiteUrl

  // TEMP: shop subdomain is still in development. We do NOT block crawling here
  // on purpose — the X-Robots-Tag: noindex header (set in middleware.ts) needs
  // Googlebot to fetch each page to see the tag and drop already-indexed pages
  // from search. A `Disallow: /` would prevent that and keep stale results live.
  // Once the shop goes live, just remove the X-Robots-Tag header in middleware.
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    isShop ? "Disallow: /cart/" : "",
    isShop ? "Disallow: /checkout/" : "",
    isShop ? "Disallow: /cs/cart" : "",
    isShop ? "Disallow: /uk/cart" : "",
    isShop ? "Disallow: /en/cart" : "",
    isShop ? "Disallow: /cs/checkout" : "",
    isShop ? "Disallow: /uk/checkout" : "",
    isShop ? "Disallow: /en/checkout" : "",
    isB2B ? "Disallow: /cs/auth/" : "",
    isB2B ? "Disallow: /uk/auth/" : "",
    isB2B ? "Disallow: /en/auth/" : "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Host: ${baseUrl}`,
    "",
  ]
    .filter(Boolean)
    .join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
