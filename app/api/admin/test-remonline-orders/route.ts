import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import remonline from "@/lib/api/remonline"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const clientId = searchParams.get("clientId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    console.log("🧪 Testing RemOnline API with params:", { orderId, clientId, page, limit })

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    }

    // Test 1: Get all orders
    console.log("🧪 Test 1: Getting all orders...")
    const ordersResult = await remonline.getOrders(page, limit)
    results.tests.getAllOrders = {
      success: ordersResult.success,
      message: ordersResult.message || "Orders fetched successfully",
      count: ordersResult.orders?.length || 0,
      total: ordersResult.total || 0,
      sampleOrder: ordersResult.orders?.[0] || null,
    }

    // Test 2: Get order by ID (if provided)
    if (orderId) {
      console.log(`🧪 Test 2: Getting order by ID: ${orderId}`)
      const orderResult = await remonline.getOrderById(Number.parseInt(orderId))
      results.tests.getOrderById = {
        success: orderResult.success,
        message: orderResult.message || "Order fetched successfully",
        order: orderResult.order || null,
      }

      // Test 3: Get order items (if order ID provided)
      if (orderResult.success) {
        console.log(`🧪 Test 3: Getting order items for order: ${orderId}`)
        const itemsResult = await remonline.getOrderItems(Number.parseInt(orderId))
        results.tests.getOrderItems = {
          success: itemsResult.success,
          message: itemsResult.message || "Order items fetched successfully",
          items: itemsResult.items || [],
          count: itemsResult.items?.length || 0,
        }
      }
    }

    // Test 4: Get orders by client ID (if provided)
    if (clientId) {
      console.log(`🧪 Test 4: Getting orders for client: ${clientId}`)
      const clientOrdersResult = await remonline.getOrdersByClientId(Number.parseInt(clientId), page, limit)
      results.tests.getOrdersByClientId = {
        success: clientOrdersResult.success,
        message: clientOrdersResult.message || "Client orders fetched successfully",
        count: clientOrdersResult.orders?.length || 0,
        total: clientOrdersResult.total || 0,
        orders: clientOrdersResult.orders || [],
      }
    }

    // Test 5: Get clients
    console.log("🧪 Test 5: Getting clients...")
    const clientsResult = await remonline.getClients(1, 5)
    results.tests.getClients = {
      success: clientsResult.success,
      message: clientsResult.message || "Clients fetched successfully",
      count: clientsResult.clients?.length || 0,
      total: clientsResult.total || 0,
      sampleClient: clientsResult.clients?.[0] || null,
    }

    // Test 6: Get order statuses
    console.log("🧪 Test 6: Getting order statuses...")
    const statusesResult = await remonline.getOrderStatuses()
    results.tests.getOrderStatuses = {
      success: statusesResult.success,
      message: statusesResult.message || "Order statuses fetched successfully",
      count: statusesResult.statuses?.length || 0,
      statuses: statusesResult.statuses || [],
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("🧪 RemOnline API test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "RemOnline API test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
