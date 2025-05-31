import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { clearStatusCache } from "@/lib/order-status-utils"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { remonline_status_id, name_uk, name_en, name_cs, color } = body

    // Базова валідація
    if (!remonline_status_id || !name_uk || !name_en || !name_cs || !color) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Перевіряємо, чи існує вже інший статус з таким remonline_status_id
    const { data: existingStatus, error: checkError } = await supabase
      .from("order_statuses")
      .select("id")
      .eq("remonline_status_id", remonline_status_id)
      .neq("id", id)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing status:", checkError)
      return NextResponse.json({ success: false, message: "Failed to check existing status" }, { status: 500 })
    }

    if (existingStatus) {
      return NextResponse.json(
        { success: false, message: "Another status with this Remonline ID already exists" },
        { status: 400 },
      )
    }

    // Оновлюємо статус
    const { data, error } = await supabase
      .from("order_statuses")
      .update({
        remonline_status_id,
        name_uk,
        name_en,
        name_cs,
        color,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ success: false, message: "Failed to update order status" }, { status: 500 })
    }

    // Очищаємо кеш статусів
    clearStatusCache()

    // Додаємо заголовок Cache-Control до відповіді
    return new NextResponse(JSON.stringify({ success: true, status: data }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Unexpected error in PUT /api/admin/order-statuses/[id]:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const supabase = createClient()

    // Видаляємо статус
    const { error } = await supabase.from("order_statuses").delete().eq("id", id)

    if (error) {
      console.error("Error deleting order status:", error)
      return NextResponse.json({ success: false, message: "Failed to delete order status" }, { status: 500 })
    }

    // Очищаємо кеш статусів
    clearStatusCache()

    // Додаємо заголовок Cache-Control до відповіді
    return new NextResponse(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/order-statuses/[id]:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}
