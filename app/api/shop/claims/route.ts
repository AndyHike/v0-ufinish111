import { NextResponse } from "next/server"

import { ShopApiError } from "@/lib/shop/api/client"
import { submitShopGuestClaim, type ShopGuestClaimInput } from "@/lib/shop/data"

export const dynamic = "force-dynamic"

// Same-origin proxy for POST /api/public/v1/claims. Keeps the secret/master key
// server-side; the browser posts the reklamace / odstoupení form and receives
// back the claim number for confirmation.
export async function POST(request: Request) {
  let body: Partial<ShopGuestClaimInput>
  try {
    body = (await request.json()) as Partial<ShopGuestClaimInput>
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  if (!body.orderNumber || !body.email || !body.kind) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }
  if (body.kind !== "COMPLAINT" && body.kind !== "WITHDRAWAL") {
    return NextResponse.json({ error: "INVALID_KIND" }, { status: 400 })
  }

  try {
    const claim = await submitShopGuestClaim(body as ShopGuestClaimInput)
    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    if (error instanceof ShopApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 })
    }
    return NextResponse.json({ error: "CLAIM_SUBMIT_FAILED" }, { status: 502 })
  }
}
