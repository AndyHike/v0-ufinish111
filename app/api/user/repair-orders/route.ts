import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user repair orders...")

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`👤 Authenticated user: ${user.id} (${user.email})`)

    const supabase = createClient()

    // Get orders with their services
    console.log("📋 Querying user_repair_orders table...")
    const { data: orders, error: ordersError } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        services:user_repair_order_services(*)
      `)
      .eq("user_id", user.id)
      .order("creation_date", { ascending: false })

    if (ordersError) {
      console.error("❌ Error fetching user orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    console.log(`📋 Found ${orders?.length || 0} orders for user ${user.id}`)

    if (orders && orders.length > 0) {
      console.log("📋 Sample order:", JSON.stringify(orders[0], null, 2))
    }

    // Transform data to match the expected format
    const transformedOrders = (orders || []).map((order) => ({
      id: order.id,
      documentId: order.document_id || `ORD-${order.id}`,
      creationDate: order.creation_date || order.created_at || new Date().toISOString(),
      deviceSerialNumber: order.device_serial_number || order.device_serial || "Не вказано",
      deviceName: order.device_name || "Невідомий пристрій",
      deviceBrand: order.device_brand,
      deviceModel: order.device_model,
      services: (order.services || []).map((service: any) => ({
        id: service.id,
        name: service.service_name || service.name || "Невідома послуга",
        price: Number(service.price) || 0,
        warrantyPeriod: service.warranty_period,
        warrantyUnits: service.warranty_units,
        status: service.service_status || service.status || "unknown",
        statusName: service.service_status_name || service.status_name || "Невідомий статус",
        statusColor: service.service_status_color || service.status_color || "bg-gray-100 text-gray-800",
      })),
      totalAmount: Number(order.total_amount) || 0,
      overallStatus: order.overall_status || "unknown",
      overallStatusName: order.overall_status_name || "Невідомий статус",
      overallStatusColor: order.overall_status_color || "bg-gray-100 text-gray-800",
    }))

    console.log(`✅ Returning ${transformedOrders.length} transformed orders`)

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("💥 Error in repair orders API:", error)
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
