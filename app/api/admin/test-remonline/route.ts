import { type NextRequest, NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("endpoint")
    const id = searchParams.get("id")
    const clientId = searchParams.get("clientId")

    console.log(`🧪 Testing RemOnline API endpoint: ${endpoint}`)

    let result: any = { success: false, message: "Unknown endpoint" }

    switch (endpoint) {
      case "auth":
        result = await remonline.auth()
        break

      case "connection":
        result = await remonline.testConnection()
        break

      case "orders":
        result = await remonline.getOrders(1, 10)
        break

      case "order":
        if (!id) {
          return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
        }
        result = await remonline.getOrderById(Number.parseInt(id))
        break

      case "order-items":
        if (!id) {
          return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 })
        }
        result = await remonline.getOrderItems(Number.parseInt(id))
        break

      case "orders-by-client":
        if (!clientId) {
          return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 })
        }
        result = await remonline.getOrdersByClientId(Number.parseInt(clientId))
        break

      case "clients":
        result = await remonline.getClients(1, 10)
        break

      case "client":
        if (!id) {
          return NextResponse.json({ success: false, error: "Client ID is required" }, { status: 400 })
        }
        result = await remonline.getClientById(Number.parseInt(id))
        break

      case "order-statuses":
        result = await remonline.getOrderStatuses()
        break

      default:
        return NextResponse.json({ success: false, error: "Unknown endpoint" }, { status: 400 })
    }

    console.log(`✅ API test result:`, result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 API test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "API test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
