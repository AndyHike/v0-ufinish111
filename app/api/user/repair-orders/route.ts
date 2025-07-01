import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = createClient()

    // Get URL parameters
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale") || "uk"
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    console.log(`Fetching repair orders for user ${userId}, locale: ${locale}, forceRefresh: ${forceRefresh}`)

    // Fetch repair orders with their services
    const { data: orders, error: ordersError } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        services:user_repair_order_services(*)
      `)
      .eq("user_id", userId)
      .order("creation_date", { ascending: false })

    if (ordersError) {
      console.error("Error fetching repair orders:", ordersError)
      return NextResponse.json({ success: false, message: "Failed to fetch repair orders" }, { status: 500 })
    }

    // Transform the data to match the frontend structure
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      document_id: order.document_id,
      creation_date: order.creation_date,
      device_serial_number: order.device_serial_number,
      device_name: order.device_name,
      device_brand: order.device_brand,
      device_model: order.device_model,
      total_amount: order.total_amount,
      overall_status: order.overall_status,
      overall_status_name: order.overall_status_name,
      overall_status_color: order.overall_status_color,
      services: order.services.map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warranty_period: service.warranty_period,
        warranty_units: service.warranty_units,
        status: service.service_status,
        status_name: service.service_status_name,
        status_color: service.service_status_color,
      })),
    }))

    console.log(`Found ${transformedOrders.length} orders for user ${userId}`)

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("Error in getUserRepairOrders API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
