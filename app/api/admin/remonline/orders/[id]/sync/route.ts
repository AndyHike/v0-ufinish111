import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncOrderFromRemonline } from "@/lib/services/remonline-order-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const remonlineOrderId = Number(id)

  if (!Number.isInteger(remonlineOrderId) || remonlineOrderId <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  const result = await syncOrderFromRemonline(remonlineOrderId, session.user.id)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
