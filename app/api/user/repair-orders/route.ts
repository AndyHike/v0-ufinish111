import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get user from session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        user_id,
        users!inner(
          id,
          email,
          remonline_id,
          first_name,
          last_name
        )
      `)
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const user = session.users

    console.log(`Fetching orders for user ${user.id} with remonline_id ${user.remonline_id}`)

    // Get orders from our database for this specific user
    const { data: orders, error: ordersError } = await supabase
      .from("repair_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching orders from database:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    console.log(`Found ${orders?.length || 0} orders for user ${user.id}`)

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      (orders || []).map(async (order: any) => {
        console.log(`Fetching items for order ${order.remonline_id}`)

        // Get order items
        const { data: items, error: itemsError } = await supabase
          .from("repair_order_items")
          .select("*")
          .eq("remonline_order_id", order.remonline_id)
          .order("created_at", { ascending: true })

        if (itemsError) {
          console.error(`Error fetching items for order ${order.remonline_id}:`, itemsError)
        } else {
          console.log(`Found ${items?.length || 0} items for order ${order.remonline_id}`)
        }

        // Get updated status information from our system
        let statusInfo = {
          name: order.status_name || "Невідомо",
          color: order.status_color || "bg-gray-100 text-gray-800",
        }

        if (order.status_id && order.status_id !== "unknown") {
          try {
            statusInfo = await getStatusByRemOnlineId(Number.parseInt(order.status_id), "uk", true)
            console.log(`Status for order ${order.remonline_id}:`, statusInfo)
          } catch (error) {
            console.error(`Error getting status for order ${order.remonline_id}:`, error)
          }
        }

        return {
          ...order,
          items: items || [],
          statusName: statusInfo.name,
          statusColor: statusInfo.color,
        }
      }),
    )

    // Transform orders to match frontend format
    const transformedOrders = ordersWithItems.map((order: any) => ({
      id: order.remonline_id?.toString() || order.id.toString(),
      reference_number: order.reference_number || order.remonline_id?.toString() || order.id.toString(),
      device_brand: order.device_brand || "Unknown",
      device_model: order.device_model || "Unknown",
      service_type: order.service_type || "Repair",
      status: order.status_id || "unknown",
      statusName: order.statusName,
      statusColor: order.statusColor,
      price: order.price,
      created_at: order.created_at,
      items: order.items.map((item: any) => ({
        id: item.remonline_item_id,
        service_name: item.service_name,
        quantity: item.quantity,
        price: item.price,
        warranty_period: item.warranty_period,
        warranty_units: item.warranty_units,
      })),
      statusHistory: [], // We'll implement this separately if needed
    }))

    console.log(`Returning ${transformedOrders.length} transformed orders`)
    console.log("Sample transformed order:", JSON.stringify(transformedOrders[0] || {}, null, 2))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("Error in repair orders API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
