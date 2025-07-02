import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get user's repair orders with services
    const { data: orders, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        user_repair_order_services (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user repair orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedOrders =
      orders?.map((order) => ({
        id: order.id,
        documentId: order.remonline_order_id,
        createdAt: order.created_at,
        deviceSerial: order.device_serial,
        deviceName: order.device_name,
        services:
          order.user_repair_order_services?.map((service: any) => ({
            name: service.service_name,
            price: service.price,
            warrantyPeriod: service.warranty_period,
            status: service.status,
          })) || [],
        totalAmount: order.total_amount,
        status: order.status,
      })) || []

    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error("User repair orders error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch repair orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
