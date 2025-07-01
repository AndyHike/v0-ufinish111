import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Fetch webhook logs with pagination
    const {
      data: logs,
      error,
      count,
    } = await supabase
      .from("webhook_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching webhook logs:", error)
      return NextResponse.json({ error: "Failed to fetch webhook logs" }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in webhook logs API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // Clear all webhook logs
    const { error } = await supabase.from("webhook_logs").delete().neq("id", 0) // Delete all records

    if (error) {
      console.error("Error clearing webhook logs:", error)
      return NextResponse.json({ error: "Failed to clear webhook logs" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Webhook logs cleared" })
  } catch (error) {
    console.error("Error clearing webhook logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
