import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { getPersonalProfileOffers } from "@/lib/discounts/profile-offers"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PERSONAL_OFFER_HEADERS = {
  "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ offer: null }, { headers: PERSONAL_OFFER_HEADERS })
    }

    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") || "cs"
    const offers = await getPersonalProfileOffers({
      userId: user.id,
      locale,
      limit: 1,
    })

    return NextResponse.json({ offer: offers[0] ?? null }, { headers: PERSONAL_OFFER_HEADERS })
  } catch (error) {
    console.error("[v0] Error fetching personal offer:", error)
    return NextResponse.json({ offer: null }, { status: 200, headers: PERSONAL_OFFER_HEADERS })
  }
}
