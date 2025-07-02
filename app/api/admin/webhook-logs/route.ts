import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Fetching webhook logs...")

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createClient()

    // Отримуємо логи з сортуванням по даті (найновіші спочатку)
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
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Обробляємо логи для зручного відображення
    const processedLogs =
      logs?.map((log) => ({
        ...log,
        display_payload: log.webhook_data?.parsed_payload || log.webhook_data,
        raw_body: log.webhook_data?.raw_body || "",
        headers: log.webhook_data?.headers || {},
        metadata: log.webhook_data?.metadata || {},
      })) || []

    console.log(`✅ Fetched ${processedLogs.length} logs`)

    return NextResponse.json({
      success: true,
      logs: processedLogs,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("💥 Error fetching webhook logs:", error)
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

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ Clearing webhook logs...")

    const supabase = createClient()

    const { error } = await supabase.from("webhook_logs").delete().neq("id", 0) // Видаляємо всі записи

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Webhook logs cleared")

    return NextResponse.json({
      success: true,
      message: "All webhook logs have been cleared",
    })
  } catch (error) {
    console.error("💥 Error clearing webhook logs:", error)
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
