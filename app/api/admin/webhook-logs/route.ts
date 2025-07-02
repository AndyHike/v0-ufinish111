import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("📋 Admin webhook logs API called")

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "100"), 500) // Max 500

    console.log(`📋 Fetching ${limit} webhook logs...`)

    const supabase = createClient()

    const {
      data: logs,
      error,
      count,
    } = await supabase
      .from("webhook_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json(
        {
          error: "Database error",
          details: error.message,
          logs: [],
          total: 0,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Successfully fetched ${logs?.length || 0} logs (total: ${count})`)

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      timestamp: new Date().toISOString(),
      success: true,
    })
  } catch (error) {
    console.error("💥 API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        logs: [],
        total: 0,
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  console.log("🗑️ Clearing webhook logs...")

  try {
    const supabase = createClient()

    const { error, count } = await supabase.from("webhook_logs").delete().neq("id", 0) // Delete all records

    if (error) {
      console.error("❌ Delete error:", error)
      return NextResponse.json(
        {
          error: "Failed to clear logs",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Cleared ${count} webhook logs`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} webhook logs`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Delete API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
