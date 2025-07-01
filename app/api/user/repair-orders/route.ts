import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"

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

    // Transform orders to match frontend format
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.remonline_id?.toString() || order.id.toString(), // Using existing column name
      reference_number: order.reference_number || order.remonline_id?.toString() || order.id.toString(),
      device_brand: order.device_brand || "Unknown",
      device_model: order.device_model || "Unknown",
      service_type: order.service_type || "Repair",
      status: order.status_id || "unknown",
      statusName: order.status_name || "Unknown",
      statusColor: getStatusColorFromHex(order.status_color) || "bg-gray-100 text-gray-800",
      price: order.price,
      created_at: order.created_at,
      statusHistory: [], // We'll implement this separately if needed
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("Error in repair orders API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// Helper function to convert hex color to Tailwind classes
function getStatusColorFromHex(hexColor: string): string {
  if (!hexColor || hexColor === "#gray") {
    return "bg-gray-100 text-gray-800"
  }

  // Convert hex to RGB to determine if it's light or dark
  const hex = hexColor.replace("#", "")
  const r = Number.parseInt(hex.substr(0, 2), 16)
  const g = Number.parseInt(hex.substr(2, 2), 16)
  const b = Number.parseInt(hex.substr(4, 2), 16)

  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // Determine color based on hex value ranges
  if (hex.toLowerCase().includes("1e79c7") || hex.toLowerCase().includes("blue")) {
    return "bg-blue-100 text-blue-800"
  } else if (hex.toLowerCase().includes("orange") || hex.toLowerCase().includes("ffa500")) {
    return "bg-amber-100 text-amber-800"
  } else if (hex.toLowerCase().includes("green") || hex.toLowerCase().includes("00ff00")) {
    return "bg-green-100 text-green-800"
  } else if (hex.toLowerCase().includes("purple") || hex.toLowerCase().includes("800080")) {
    return "bg-purple-100 text-purple-800"
  } else if (hex.toLowerCase().includes("red") || hex.toLowerCase().includes("ff0000")) {
    return "bg-red-100 text-red-800"
  } else if (brightness > 128) {
    // Light color
    return "bg-gray-100 text-gray-800"
  } else {
    // Dark color
    return "bg-gray-800 text-gray-100"
  }
}
