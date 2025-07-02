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
      document_id: order.document_id,
      creation_date: order.creation_date,
      device_serial_number: order.device_serial_number,
      device_name: order.device_name,
      device_brand: order.device_brand,
      device_model: order.device_model,
      services: (order.services || []).map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warranty_period: service.warranty_period,
        warranty_units: service.warranty_units,
        status: service.service_status,
        status_name: service.service_status_name,
        status_color: service.service_status_color,
      })),
      total_amount: order.total_amount,
      overall_status: order.overall_status,
      overall_status_name: order.overall_status_name,
      overall_status_color: order.overall_status_color,
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
