import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { ignoreOrderSyncIssue } from "@/lib/services/remonline-order-sync-issues"

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const issue = await ignoreOrderSyncIssue(id, session.user.id)

  return NextResponse.json({ success: true, issue })
}
