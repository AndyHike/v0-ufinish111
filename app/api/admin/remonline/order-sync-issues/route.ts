import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listOrderSyncIssues } from "@/lib/services/remonline-order-sync-issues"

type OrderSyncIssueStatus = "open" | "resolved" | "ignored"

function getIssueStatus(value: string | null): OrderSyncIssueStatus {
  if (value === "resolved" || value === "ignored") return value
  return "open"
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = getIssueStatus(searchParams.get("status"))
  const issues = await listOrderSyncIssues(status)

  return NextResponse.json({ success: true, issues })
}
