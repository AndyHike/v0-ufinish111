import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  try {
    console.log("🔍 GET /api/user/repair-orders called")

    // Get the current user session
    const session = await getSession()
    if (!session || !session.user) {
      console.log("❌ No session or user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`👤 Getting repair orders for user: ${userId}`)

    const supabase = createClient()

    // Check if tables exist first
    const { data: tableCheck, error: tableError } = await supabase.from("user_repair_orders").select("count").limit(1)

    if (tableError) {
      console.error("❌ Table check error:", tableError)
      // If table doesn't exist, return empty array instead of error
      if (tableError.code === "42P01") {
        console.log("📋 Tables don't exist yet, returning empty orders")
        return NextResponse.json({
          success: true,
          orders: [],
        })
      }
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: tableError.message,
        },
        { status: 500 },
      )
    }

    // Fetch repair orders with their services
    const { data: orders, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        services:user_repair_order_services(*)
      `)
      .eq("user_id", userId)
      .order("creation_date", { ascending: false })

    if (error) {
      console.error("❌ Error fetching repair orders:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch repair orders",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`📋 Found ${orders?.length || 0} orders`)

    // Transform the data to match the frontend structure
    const transformedOrders = (orders || []).map((order) => ({
      id: order.id,
      documentId: order.document_id,
      creationDate: order.creation_date,
      deviceSerialNumber: order.device_serial_number,
      deviceName: order.device_name,
      deviceBrand: order.device_brand,
      deviceModel: order.device_model,
      totalAmount: order.total_amount,
      overallStatus: order.overall_status,
      overallStatusName: order.overall_status_name,
      overallStatusColor: order.overall_status_color,
      services: (order.services || []).map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warrantyPeriod: service.warranty_period,
        warrantyUnits: service.warranty_units,
        status: service.service_status,
        statusName: service.service_status_name,
        statusColor: service.service_status_color,
      })),
    }))

    console.log(`✅ Transformed ${transformedOrders.length} orders`)
    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("💥 Error in GET /api/user/repair-orders:", error)
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
