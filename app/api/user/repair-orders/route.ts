import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("🔍 GET /api/user/repair-orders called")

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`👤 Getting repair orders for user: ${user.id}`)

    const supabase = createClient()

    // Get user's repair orders with services
    const { data: orders, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        user_repair_order_services (*)
      `)
      .eq("user_id", user.id)
      .order("creation_date", { ascending: false })

    if (error) {
      console.error("❌ Error fetching user repair orders:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch orders",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`📋 Found ${orders?.length || 0} orders`)

    // Transform the data to match the expected format
    const transformedOrders =
      orders?.map((order) => ({
        id: order.id,
        documentId: order.document_id || order.remonline_order_id,
        createdAt: order.creation_date || order.created_at,
        deviceSerial: order.device_serial_number || order.device_serial,
        deviceName: order.device_name,
        deviceBrand: order.device_brand,
        deviceModel: order.device_model,
        services:
          order.user_repair_order_services?.map((service: any) => ({
            id: service.id,
            name: service.service_name,
            price: service.price,
            warrantyPeriod: service.warranty_period,
            warrantyUnits: service.warranty_units,
            status: service.service_status || service.status,
            statusName: service.service_status_name,
            statusColor: service.service_status_color,
          })) || [],
        totalAmount: order.total_amount,
        status: order.overall_status || order.status,
        statusName: order.overall_status_name,
        statusColor: order.overall_status_color,
      })) || []

    console.log(`✅ Transformed ${transformedOrders.length} orders`)
    return NextResponse.json({ orders: transformedOrders })
  } catch (error) {
    console.error("💥 User repair orders error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch repair orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
