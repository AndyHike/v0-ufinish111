import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get recent webhook logs from database
    const { data: logs, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching webhook logs:", error)
      return NextResponse.json({ error: "Failed to fetch webhook logs" }, { status: 500 })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("Webhook logs error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch webhook logs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
