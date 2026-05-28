import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { b2bSiteUrl, mainSiteUrl } from "@/lib/site-config"

export async function GET() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""
  const isB2B = isB2BHost(host)
  const baseUrl = isB2B ? b2bSiteUrl : mainSiteUrl

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
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
