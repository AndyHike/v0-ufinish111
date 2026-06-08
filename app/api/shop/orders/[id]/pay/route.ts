import { NextResponse } from "next/server"

import { ShopApiError } from "@/lib/shop/api/client"
import { payShopOrder } from "@/lib/shop/data"

export const dynamic = "force-dynamic"

// Same-origin proxy for POST /api/public/v1/orders/[id]/pay. Returns the Stripe
// PaymentIntent clientSecret + merchant publishableKey for the browser to render
// the Payment / Express Checkout elements. Idempotent: the admin reuses an
// existing PaymentIntent for the order.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let publicToken: string | undefined
  try {
    const body = (await request.json()) as { publicToken?: string }
    publicToken = body.publicToken
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 })
  }

  if (!publicToken) {
    return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 })
  }

  try {
    const payment = await payShopOrder(id, publicToken)
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof ShopApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 })
    }
    return NextResponse.json({ error: "PAYMENT_INIT_FAILED" }, { status: 502 })
  }
}
