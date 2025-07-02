import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("📋 [ADMIN API] Fetching webhook logs...")

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 200)
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log(`📋 [ADMIN API] Limit: ${limit}, Offset: ${offset}`)

    const supabase = createClient()

    // Отримуємо логи з підрахунком загальної кількості
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
      console.error("❌ [ADMIN API] Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: error.message,
          logs: [],
          total: 0,
        },
        { status: 500 },
      )
    }

    console.log(`✅ [ADMIN API] Found ${logs?.length || 0} logs (total: ${count})`)

    // Обробляємо логи для кращого відображення
    const processedLogs =
      logs?.map((log) => ({
        ...log,
        // Додаємо зручні поля для відображення
        display_payload: log.webhook_data?.parsed_payload || log.webhook_data || {},
        raw_body: log.webhook_data?.raw_body || "",
        headers: log.webhook_data?.headers || {},
        metadata: log.webhook_data?.metadata || {},
      })) || []

    return NextResponse.json({
      success: true,
      logs: processedLogs,
      total: count || 0,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 [ADMIN API] Exception:", error)
    return NextResponse.json(
      {
        success: false,
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
  console.log("🗑️ [ADMIN API] Clearing webhook logs...")

  try {
    const supabase = createClient()

    const { error, count } = await supabase.from("webhook_logs").delete().neq("id", 0) // Видаляємо всі записи

    if (error) {
      console.error("❌ [ADMIN API] Delete error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to clear logs",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`✅ [ADMIN API] Cleared ${count || 0} logs`)

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${count || 0} webhook logs`,
      cleared_count: count || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 [ADMIN API] Delete exception:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
