import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getUser } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get orders with their services
    const { data: orders, error: ordersError } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        services:user_repair_order_services(*)
      `)
      .eq("user_id", user.id)
      .order("creation_date", { ascending: false })

    if (ordersError) {
      console.error("Error fetching user orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform data to match the expected format
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      documentId: order.document_id,
      creationDate: order.creation_date,
      deviceSerialNumber: order.device_serial_number,
      deviceName: order.device_name,
      services: order.services.map((service: any) => ({
        id: service.id,
        name: service.service_name,
        price: service.price,
        warrantyPeriod: service.warranty_period,
        warrantyUnits: service.warranty_units,
        status: service.service_status,
        statusName: service.service_status_name,
        statusColor: service.service_status_color,
      })),
      totalAmount: order.total_amount,
      overallStatus: order.overall_status,
      overallStatusName: order.overall_status_name,
      overallStatusColor: order.overall_status_color,
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("Error in repair orders API:", error)
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
