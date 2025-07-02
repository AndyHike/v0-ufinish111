import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = createClient()

    const { data: logs, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching webhook logs:", error)
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("Webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("webhook_logs").delete().neq("id", 0)

    if (error) {
      console.error("Error clearing webhook logs:", error)
      return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clear webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
