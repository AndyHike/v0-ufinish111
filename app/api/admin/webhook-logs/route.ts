import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = createClient()

    console.log("📋 Fetching webhook logs from database...")

    const { data: logs, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Error fetching webhook logs:", error)
      return NextResponse.json({ error: "Failed to fetch logs", details: error }, { status: 500 })
    }

    console.log(`✅ Found ${logs?.length || 0} webhook logs`)

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("💥 Webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = createClient()

    console.log("🗑️ Clearing all webhook logs...")

    const { error } = await supabase.from("webhook_logs").delete().neq("id", 0)

    if (error) {
      console.error("❌ Error clearing webhook logs:", error)
      return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
    }

    console.log("✅ Webhook logs cleared successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("💥 Clear webhook logs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
