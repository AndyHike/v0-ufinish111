import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user locale
    const supabase = createClient()
    const { data: userData } = await supabase.from("users").select("locale").eq("id", session.user.id).single()

    const userLocale = userData?.locale || "uk"

    // Fetch user's repair orders
    const { data: orders, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        user_repair_order_services (
          id,
          service_name,
          price,
          warranty_period,
          warranty_units
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching repair orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Transform orders data
    const transformedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        // Get status information with user's locale
        const statusInfo = await getStatusByRemOnlineId(Number.parseInt(order.overall_status), userLocale)

        return {
          id: order.id,
          documentId: order.document_id || "N/A",
          creationDate: order.creation_date || order.created_at,
          deviceSerialNumber: order.device_serial_number || "Not specified",
          deviceName: order.device_name || "Unknown device",
          deviceBrand: order.device_brand,
          deviceModel: order.device_model,
          services: (order.user_repair_order_services || []).map((service: any) => ({
            id: service.id,
            name: service.service_name,
            price: Number.parseFloat(service.price) || 0,
            warrantyPeriod: service.warranty_period,
            warrantyUnits: service.warranty_units,
          })),
          totalAmount: Number.parseFloat(order.total_amount) || 0,
          overallStatus: order.overall_status,
          overallStatusName: statusInfo.name,
          overallStatusColor: statusInfo.color,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    })
  } catch (error) {
    console.error("Error in repair orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
