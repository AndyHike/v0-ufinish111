import { NextResponse } from "next/server"

import { ShopApiError } from "@/lib/shop/api/client"
import { lookupShopClaim } from "@/lib/shop/data"
import type { ShopLocale } from "@/lib/shop/types"

export const dynamic = "force-dynamic"

const LOCALES: ShopLocale[] = ["cs", "uk", "en"]

// Same-origin proxy for POST /api/public/v1/claims/lookup. Verifies the
// order#+email pair server-side (secret key stays here) and returns the order
// lines + return address for the claim form's item-selection step.
export async function POST(request: Request) {
  let body: { orderNumber?: string; email?: string; locale?: string }
  try {
    body = (await request.json()) as { orderNumber?: string; email?: string; locale?: string }
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  if (!body.orderNumber || !body.email) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  const locale: ShopLocale = LOCALES.includes(body.locale as ShopLocale) ? (body.locale as ShopLocale) : "cs"

  try {
    const result = await lookupShopClaim(body.orderNumber, body.email, locale)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ShopApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 })
    }
    return NextResponse.json({ error: "LOOKUP_FAILED" }, { status: 502 })
  }
}
