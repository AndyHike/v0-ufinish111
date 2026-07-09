import { headers } from "next/headers"

import { isB2BHost } from "@/lib/b2b-routing"
import {
  getMainSitemapSegmentEntries,
  isMainSitemapLocale,
  isMainSitemapSegment,
  type MainSitemapLocale,
} from "@/lib/seo/main-sitemap"
import { createSitemapXml } from "@/lib/seo/sitemap-xml"
import { isShopHost } from "@/lib/shop-routing"

/**
 * Segmented sitemap files for the MAIN site: /sitemaps/{segment}-{locale}.xml
 * (e.g. services-cs.xml), referenced by the sitemap index at /sitemap.xml so
 * GSC reports coverage per segment AND per locale. The locale-less
 * /sitemaps/{segment}.xml form still serves all locales for anything that has
 * the old URLs bookmarked or submitted. The b2b/shop hosts keep their own
 * single-file sitemaps and don't serve these.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ segment: string }> }) {
  const { segment: segmentParam } = await params
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || ""

  const name = segmentParam.replace(/\.xml$/, "")
  let segment = name
  let locale: MainSitemapLocale | undefined
  const dashIndex = name.lastIndexOf("-")
  if (dashIndex !== -1) {
    const segmentPart = name.slice(0, dashIndex)
    const localePart = name.slice(dashIndex + 1)
    if (isMainSitemapSegment(segmentPart) && isMainSitemapLocale(localePart)) {
      segment = segmentPart
      locale = localePart
    }
  }

  if (isShopHost(host) || isB2BHost(host) || !segmentParam.endsWith(".xml") || !isMainSitemapSegment(segment)) {
    return new Response("Not found", { status: 404 })
  }

  const entries = await getMainSitemapSegmentEntries(segment, locale)

  return new Response(createSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
