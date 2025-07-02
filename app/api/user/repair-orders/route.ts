import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("🔍 GET /api/user/repair-orders called")

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`👤 User ID: ${user.id}`)
    console.log(`📧 User email: ${user.email}`)

    const supabase = createClient()

    // First, let's check if the tables exist
    console.log("🔍 Checking if user_repair_orders table exists...")
    const { data: tableCheck, error: tableError } = await supabase
      .from("user_repair_orders")
      .select("count(*)")
      .limit(1)

    if (tableError) {
      console.error("❌ Table check error:", tableError)
      return NextResponse.json(
        {
          error: "Database table not found",
          details: tableError.message,
          suggestion: "Please run the SQL scripts to create the required tables",
        },
        { status: 500 },
      )
    }

    console.log("✅ Table exists, checking for user orders...")

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
      console.error("❌ Error fetching user repair orders:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch orders",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`📋 Found ${orders?.length || 0} orders for user ${user.id}`)

    if (orders && orders.length > 0) {
      console.log("📋 Sample order structure:", JSON.stringify(orders[0], null, 2))
    }

    // Transform the data to match the expected format
    const transformedOrders = (orders || []).map((order) => ({
      id: order.id,
      documentId: order.remonline_order_id || order.document_id,
      createdAt: order.created_at,
      deviceSerial: order.device_serial || order.device_serial_number,
      deviceName: order.device_name,
      deviceBrand: order.device_brand,
      deviceModel: order.device_model,
      totalAmount: order.total_amount,
      status: order.status || order.overall_status,
      statusName: order.status_name || order.overall_status_name,
      statusColor: order.status_color || order.overall_status_color,
      services: (order.user_repair_order_services || []).map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warrantyPeriod: service.warranty_period,
        warrantyUnits: service.warranty_units,
        status: service.status || service.service_status,
        statusName: service.status_name || service.service_status_name,
        statusColor: service.status_color || service.service_status_color,
      })),
    }))

    console.log(`✅ Transformed ${transformedOrders.length} orders`)
    console.log("📤 Returning orders to client")

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length,
    })
  } catch (error) {
    console.error("💥 Unexpected error in user repair orders:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch repair orders",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
