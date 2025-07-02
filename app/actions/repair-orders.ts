"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function getUserRepairOrders() {
  try {
    console.log("🔍 getUserRepairOrders server action called")

    // Get the current user session
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user found in session")
      return { success: false, message: "Unauthorized" }
    }

    const userId = user.id
    console.log(`👤 Getting repair orders for user: ${userId}`)
    console.log(`📧 User email: ${user.email}`)

    const supabase = createClient()

    // First, let's check if the tables exist and have data
    console.log("🔍 Checking user_repair_orders table...")
    const { data: ordersCheck, error: ordersCheckError } = await supabase
      .from("user_repair_orders")
      .select("count(*)")
      .eq("user_id", userId)

    console.log("📊 Orders check result:", { ordersCheck, ordersCheckError })

    if (ordersCheckError) {
      console.error("❌ Table check error:", ordersCheckError)
      return {
        success: false,
        message: "Database table not found",
        details: ordersCheckError.message,
        suggestion: "Please run the SQL scripts to create the required tables",
      }
    }

    // Fetch repair orders with their services
    console.log("📋 Fetching repair orders with services...")
    const { data: orders, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        user_repair_order_services(*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching repair orders:", error)
      return {
        success: false,
        message: "Failed to fetch repair orders",
        details: error.message,
      }
    }

    console.log(`📋 Found ${orders?.length || 0} orders`)

    if (orders && orders.length > 0) {
      console.log("📋 Sample order structure:", JSON.stringify(orders[0], null, 2))
    } else {
      console.log("📋 No orders found for user")
      // Let's also check if there are any orders in the table at all
      const { data: allOrders, error: allOrdersError } = await supabase.from("user_repair_orders").select("count(*)")

      console.log("📊 Total orders in table:", { allOrders, allOrdersError })
    }

    // Transform the data to match the frontend structure
    const transformedOrders = (orders || []).map((order) => ({
      id: order.id,
      documentId: order.document_id || order.remonline_order_id,
      creationDate: order.creation_date || order.created_at,
      createdAt: order.created_at,
      deviceSerialNumber: order.device_serial_number || order.device_serial,
      deviceName: order.device_name,
      deviceBrand: order.device_brand,
      deviceModel: order.device_model,
      totalAmount: order.total_amount,
      overallStatus: order.overall_status || order.status,
      overallStatusName: order.overall_status_name || order.status_name,
      overallStatusColor: order.overall_status_color || order.status_color,
      status: order.status || order.overall_status,
      statusName: order.status_name || order.overall_status_name,
      statusColor: order.status_color || order.overall_status_color,
      services: (order.user_repair_order_services || []).map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warrantyPeriod: service.warranty_period,
        warrantyUnits: service.warranty_units,
        status: service.service_status || service.status,
        statusName: service.service_status_name || service.status_name,
        statusColor: service.service_status_color || service.status_color,
      })),
    }))

    console.log(`✅ Transformed ${transformedOrders.length} orders`)
    return {
      success: true,
      orders: transformedOrders,
      total: transformedOrders.length,
    }
  } catch (error) {
    console.error("💥 Error in getUserRepairOrders:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
