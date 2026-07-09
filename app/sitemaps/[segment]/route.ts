import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import { getMainSitemapSegmentEntries, isMainSitemapSegment } from "@/lib/seo/main-sitemap"
import { createSitemapXml } from "@/lib/seo/sitemap-xml"
import { isShopHost } from "@/lib/shop-routing"

/**
 * Segmented sitemap files for the MAIN site: /sitemaps/{core,hubs,services,articles}.xml.
 * Referenced by the sitemap index at /sitemap.xml. The b2b/shop hosts keep
 * their own single-file sitemaps and don't serve these.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ segment: string }> }) {
  const { segment: segmentParam } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  const segment = segmentParam.replace(/\.xml$/, "")
  if (isShopHost(host) || isB2BHost(host) || !segmentParam.endsWith(".xml") || !isMainSitemapSegment(segment)) {
    return new Response("Not found", { status: 404 })
  }

  const entries = await getMainSitemapSegmentEntries(segment)

  return new Response(createSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
