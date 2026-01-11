import { NextResponse } from "next/server"
import { getActiveDiscounts, createDiscount } from "@/lib/discounts/queries"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const discounts = await getActiveDiscounts()
    return NextResponse.json(discounts)
  } catch (error) {
    console.error("Error fetching discounts:", error)
    return NextResponse.json({ error: "Failed to fetch discounts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const discount = await createDiscount({
      name: body.name,
      code: body.code.toUpperCase(),
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      scopeType: body.scopeType,
      serviceId: body.serviceId,
      brandId: body.brandId,
      seriesId: body.seriesId,
      modelId: body.modelId,
      isActive: body.isActive ?? true,
      startsAt: body.startsAt,
      expiresAt: body.expiresAt,
      maxUses: body.maxUses,
      maxUsesPerUser: body.maxUsesPerUser,
    })

    return NextResponse.json(discount)
  } catch (error) {
    console.error("Error creating discount:", error)
    return NextResponse.json({ error: "Failed to create discount" }, { status: 500 })
  }
}
