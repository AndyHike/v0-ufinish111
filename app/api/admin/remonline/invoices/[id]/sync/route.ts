import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncInvoiceFromRemonline } from "@/lib/services/remonline-invoice-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const remonlineInvoiceId = Number(id)

  if (!Number.isInteger(remonlineInvoiceId) || remonlineInvoiceId <= 0) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 })
  }

  const result = await syncInvoiceFromRemonline(remonlineInvoiceId)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
