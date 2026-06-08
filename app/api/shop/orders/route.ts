import { NextResponse } from "next/server"

import { ShopApiError } from "@/lib/shop/api/client"
import { createShopOrder } from "@/lib/shop/data"
import type { ShopCreateOrderInput } from "@/lib/shop/types"

export const dynamic = "force-dynamic"

// Same-origin proxy for POST /api/public/v1/orders. Keeps the secret/master key
// server-side; the browser posts the assembled order and receives back the
// orderId + publicToken needed to drive the Stripe payment step.
export async function POST(request: Request) {
  let body: Partial<ShopCreateOrderInput>
  try {
    body = (await request.json()) as Partial<ShopCreateOrderInput>
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: "EMPTY_CART" }, { status: 400 })
  }
  if (!body.customer || !body.delivery) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 })
  }

  try {
    const order = await createShopOrder(body as ShopCreateOrderInput)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof ShopApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 })
    }
    return NextResponse.json({ error: "ORDER_CREATE_FAILED" }, { status: 502 })
  }
}
