import { NextResponse } from "next/server"

import { ShopApiError } from "@/lib/shop/api/client"
import { getShopOrderStatus } from "@/lib/shop/data"

export const dynamic = "force-dynamic"

// Same-origin proxy for GET /api/public/v1/orders/[id]. The browser polls this
// after confirming payment until paymentStatus === "PAID" (set asynchronously by
// the admin's Stripe webhook). The per-order publicToken authorizes the read and
// is passed via the `x-order-token` header (or `token` query as a fallback).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const publicToken = request.headers.get("x-order-token") ?? searchParams.get("token")

  if (!publicToken) {
    return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 })
  }

  try {
    const status = await getShopOrderStatus(id, publicToken)
    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof ShopApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 ? error.status : 502 })
    }
    return NextResponse.json({ error: "ORDER_STATUS_FAILED" }, { status: 502 })
  }
}
