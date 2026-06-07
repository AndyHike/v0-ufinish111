import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

/**
 * On-demand revalidation webhook (admin → storefront), per api_docs/revalidation.md.
 *
 * Configure in the admin (Developers → Frontend Revalidation):
 *   - path:   /api/shop/revalidate
 *   - secret: generated per-store secret (or SYSTEM_MASTER_KEY)
 * Set the same secret on the storefront as REVALIDATE_SECRET.
 *
 * Body contract:
 *   { token, domain?, event?: { siteId, changeType, collection?, itemSlug?, previousItemSlug? }, tags?: string[] }
 *
 * Primary mechanism: iterate `tags` and call revalidateTag (reads are tagged
 * with the same `site:{storeId}:...` tags). As a storeId-independent fallback we
 * also revalidate affected paths from the structured `event`.
 */

const SHOP_LOCALES = ["cs", "uk", "en"] as const

interface RevalidateEvent {
  changeType?: string
  collection?: string
  itemSlug?: string
  previousItemSlug?: string
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? process.env.SHOP_REVALIDATE_SECRET ?? ""

  const body = (await request.json().catch(() => null)) as
    | { token?: string; tags?: unknown; event?: RevalidateEvent }
    | null

  if (!secret || !body?.token || body.token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const tags = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : []
  for (const tag of tags) {
    revalidateTag(tag)
  }

  // Path-based fallback from the structured event — works even when storeId is
  // not configured (so reads carry no cache tags). Internal route paths live
  // under /shop/[locale]/...
  const event = body.event ?? {}
  const paths = new Set<string>()
  for (const locale of SHOP_LOCALES) {
    paths.add(`/shop/${locale}`)
    if (typeof event.collection === "string" && event.collection) {
      paths.add(`/shop/${locale}/category/${event.collection}`)
    }
    for (const slug of [event.itemSlug, event.previousItemSlug]) {
      if (typeof slug === "string" && slug) {
        paths.add(`/shop/${locale}/product/${slug}`)
      }
    }
  }
  for (const path of paths) {
    revalidatePath(path)
  }

  return NextResponse.json({ ok: true, revalidatedTags: tags.length, revalidatedPaths: paths.size })
}
