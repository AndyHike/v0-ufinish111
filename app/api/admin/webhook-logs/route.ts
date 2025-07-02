import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createClient()

    const { data: logs, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching webhook logs:", error)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    const { count } = await supabase.from("webhook_logs").select("*", { count: "exact", head: true })

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { error } = await supabase.from("webhook_logs").delete().neq("id", 0)

    if (error) {
      console.error("Error clearing webhook logs:", error)
      return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Logs cleared successfully" })
  } catch (error) {
    console.error("Clear webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
