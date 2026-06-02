import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

function toAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

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

    // Get locale from request headers or URL
    const url = new URL(request.url)
    const locale =
      url.searchParams.get("locale") || request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] || "uk"
    console.log(`🌍 Using locale: ${locale}`)

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

    const orderIds = (orders || []).map((order) => order.id)
    const servicesByOrderId = new Map<string, any[]>()

    if (orderIds.length > 0) {
      const { data: services, error: servicesError } = await supabase
        .from("user_repair_order_services")
        .select(
          `
          id,
          order_id,
          remonline_service_id,
          service_name,
          price,
          warranty_period,
          warranty_units,
          created_at,
          updated_at
        `,
        )
        .in("order_id", orderIds)
        .order("created_at", { ascending: true })

      if (servicesError) {
        console.error("❌ Error fetching order services:", servicesError)
        return NextResponse.json({ success: false, error: "Failed to fetch order services" }, { status: 500 })
      }

      for (const service of services || []) {
        const group = servicesByOrderId.get(service.order_id) || []
        group.push(service)
        servicesByOrderId.set(service.order_id, group)
      }
    }

    // Add services and localized status labels.
    const ordersWithServices = await Promise.all(
      (orders || []).map(async (order) => {
        // Get status information with current locale
        const statusInfo = await getStatusByRemOnlineId(Number.parseInt(order.overall_status), locale, true)
        const services = servicesByOrderId.get(order.id) || []

        return {
          id: order.id,
          documentId: order.document_id || "not_specified",
          creationDate: order.creation_date || order.created_at,
          deviceSerialNumber: order.device_serial_number || "not_specified",
          deviceName: order.device_name || "unknown_device",
          deviceBrand: order.device_brand,
          deviceModel: order.device_model,
          totalAmount: Number(order.total_amount) || 0,
          overallStatus: order.overall_status || "unknown",
          overallStatusName: statusInfo.name,
          overallStatusColor: statusInfo.color,
          services: services.map((service) => ({
            id: service.id,
            name: service.service_name || "unknown_service",
            price: toAmount(service.price),
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
