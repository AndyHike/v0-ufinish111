import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching user repair orders...")

    // Get current user session
    const session = await getSession()
    if (!session?.user?.id) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`👤 Fetching orders for user: ${userId}`)

    const supabase = createClient()

    // Fetch user's repair orders with services
    const { data: orders, error: ordersError } = await supabase
      .from("user_repair_orders")
      .select(
        `
        id,
        remonline_order_id,
        document_id,
        creation_date,
        device_serial_number,
        device_name,
        device_brand,
        device_model,
        total_amount,
        overall_status,
        overall_status_name,
        overall_status_color,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .order("creation_date", { ascending: false })

    if (ordersError) {
      console.error("❌ Error fetching orders:", ordersError)
      return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 })
    }

    console.log(`📦 Found ${orders?.length || 0} orders`)

    // Fetch services for each order
    const ordersWithServices = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: services, error: servicesError } = await supabase
          .from("user_repair_order_services")
          .select(
            `
            id,
            remonline_service_id,
            service_name,
            price,
            warranty_period,
            warranty_units,
            created_at,
            updated_at
          `,
          )
          .eq("order_id", order.id)
          .order("created_at", { ascending: true })

        if (servicesError) {
          console.error(`❌ Error fetching services for order ${order.id}:`, servicesError)
        }

        return {
          id: order.id,
          documentId: order.document_id || "Не вказано",
          creationDate: order.creation_date || order.created_at,
          deviceSerialNumber: order.device_serial_number || "Не вказано",
          deviceName: order.device_name || "Невідомий пристрій",
          deviceBrand: order.device_brand,
          deviceModel: order.device_model,
          totalAmount: Number(order.total_amount) || 0,
          overallStatus: order.overall_status || "unknown",
          overallStatusName: order.overall_status_name || "Невідомий статус",
          overallStatusColor: order.overall_status_color || "bg-gray-100 text-gray-800",
          services: (services || []).map((service) => ({
            id: service.id,
            name: service.service_name || "Невідома послуга",
            price: Number(service.price) || 0,
            warrantyPeriod: service.warranty_period,
            warrantyUnits: service.warranty_units,
          })),
        }
      }),
    )

    console.log(`✅ Successfully processed ${ordersWithServices.length} orders with services`)

    return NextResponse.json({
      success: true,
      orders: ordersWithServices,
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
