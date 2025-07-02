"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function getUserRepairOrders() {
  try {
    console.log("🔍 getUserRepairOrders called")

    // Get the current user session
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No user found")
      return { success: false, message: "Unauthorized" }
    }

    const userId = user.id
    console.log(`👤 Getting repair orders for user: ${userId}`)

    const supabase = createClient()

    // First, let's check if the tables exist and have data
    const { data: ordersCheck, error: ordersCheckError } = await supabase
      .from("user_repair_orders")
      .select("count(*)")
      .eq("user_id", userId)

    console.log("📊 Orders check result:", { ordersCheck, ordersCheckError })

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
      return {
        success: false,
        message: "Failed to fetch repair orders",
        details: error.message,
      }
    }

    console.log(`📋 Found ${orders?.length || 0} orders`)

    if (orders && orders.length > 0) {
      console.log("📋 Sample order structure:", JSON.stringify(orders[0], null, 2))
    }

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
    return { success: true, orders: transformedOrders }
  } catch (error) {
    console.error("💥 Error in getUserRepairOrders:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
