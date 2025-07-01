import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import remonline from "@/lib/api/remonline"

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

    // If user doesn't have remonline_id, we can't fetch orders
    if (!user.remonline_id) {
      return NextResponse.json({
        success: true,
        orders: [],
        message: "No RemOnline ID found for user",
      })
    }

    try {
      // Authenticate with RemOnline
      const authResult = await remonline.auth()
      if (!authResult.success) {
        console.error("Failed to authenticate with RemOnline:", authResult.message)
        return NextResponse.json({
          success: true,
          orders: [],
          message: "Failed to connect to RemOnline",
        })
      }

      // Get orders from RemOnline for this client
      const ordersResult = await remonline.getOrdersByClientId(user.remonline_id)

      if (!ordersResult.success) {
        console.error("Failed to fetch orders from RemOnline:", ordersResult.message)
        return NextResponse.json({
          success: true,
          orders: [],
          message: "Failed to fetch orders from RemOnline",
        })
      }

      // Get order statuses for mapping
      const statusesResult = await remonline.getOrderStatuses()
      const statusMap = new Map()

      if (statusesResult.success && statusesResult.statuses) {
        statusesResult.statuses.forEach((status: any) => {
          statusMap.set(status.id.toString(), {
            name: status.title || status.name,
            color: getStatusColor(status.title || status.name),
          })
        })
      }

      // Transform orders to match our frontend format
      const transformedOrders = (ordersResult.orders || []).map((order: any) => {
        const statusInfo = statusMap.get(order.status_id?.toString()) || {
          name: order.status_title || "Unknown",
          color: "bg-gray-100 text-gray-800",
        }

        return {
          id: order.id.toString(),
          reference_number: order.number || order.id.toString(),
          device_brand: order.device_brand || order.brand || "Unknown",
          device_model: order.device_model || order.model || "Unknown",
          service_type: order.service_type || order.work_type || "Repair",
          status: order.status_id?.toString() || "unknown",
          statusName: statusInfo.name,
          statusColor: statusInfo.color,
          price: order.total_price || order.price || null,
          created_at: order.created_at || new Date().toISOString(),
          statusHistory: [], // We'll need to implement this separately if needed
        }
      })

      return NextResponse.json({
        success: true,
        orders: transformedOrders,
      })
    } catch (remonlineError) {
      console.error("RemOnline API error:", remonlineError)
      return NextResponse.json({
        success: true,
        orders: [],
        message: "Error connecting to RemOnline",
      })
    }
  } catch (error) {
    console.error("Error in repair orders API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Helper function to determine status color based on status name
function getStatusColor(statusName: string): string {
  const statusLower = statusName.toLowerCase()

  if (statusLower.includes("новий") || statusLower.includes("new")) {
    return "bg-blue-100 text-blue-800"
  } else if (statusLower.includes("в роботі") || statusLower.includes("в работе") || statusLower.includes("process")) {
    return "bg-amber-100 text-amber-800"
  } else if (statusLower.includes("готов") || statusLower.includes("ready") || statusLower.includes("completed")) {
    return "bg-green-100 text-green-800"
  } else if (statusLower.includes("видан") || statusLower.includes("delivered")) {
    return "bg-purple-100 text-purple-800"
  } else if (statusLower.includes("скасован") || statusLower.includes("cancelled")) {
    return "bg-red-100 text-red-800"
  } else {
    return "bg-gray-100 text-gray-800"
  }
}
