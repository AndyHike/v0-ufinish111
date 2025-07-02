import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, order_id, client_id } = body

    console.log("🧪 RemOnline API Test:", { action, order_id, client_id })

    // Check environment variables
    const apiKey = process.env.REMONLINE_API_KEY
    const apiToken = process.env.REMONLINE_API_TOKEN

    if (!apiKey || !apiToken) {
      return NextResponse.json({
        success: false,
        error: "RemOnline API credentials not configured",
        details: {
          api_key_set: !!apiKey,
          api_token_set: !!apiToken,
        },
      })
    }

    switch (action) {
      case "test_connection":
        return await testConnection(apiKey, apiToken)

      case "get_order":
        if (!order_id) {
          return NextResponse.json({
            success: false,
            error: "Order ID is required",
          })
        }
        return await fetchOrder(apiKey, apiToken, order_id)

      case "get_client":
        if (!client_id) {
          return NextResponse.json({
            success: false,
            error: "Client ID is required",
          })
        }
        return await fetchClient(apiKey, apiToken, client_id)

      default:
        return NextResponse.json({
          success: false,
          error: "Unknown action",
        })
    }
  } catch (error) {
    console.error("💥 RemOnline API test error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

async function testConnection(apiKey: string, apiToken: string) {
  try {
    console.log("🔍 Testing RemOnline API connection...")

    // Test basic API connection by fetching user info or company info
    const response = await fetch("https://api.remonline.ru/company", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "DeviceHelp/1.0",
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log("✅ RemOnline API connection successful")
      return NextResponse.json({
        success: true,
        message: "RemOnline API connection successful",
        data: {
          status: response.status,
          company_info: data,
          api_version: "v1",
          connection_test: true,
        },
      })
    } else {
      console.error("❌ RemOnline API connection failed:", data)
      return NextResponse.json({
        success: false,
        error: "API connection failed",
        details: {
          status: response.status,
          response: data,
        },
      })
    }
  } catch (error) {
    console.error("💥 Connection test error:", error)
    return NextResponse.json({
      success: false,
      error: "Connection test failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

async function fetchOrder(apiKey: string, apiToken: string, orderId: string) {
  try {
    console.log("📦 Fetching order:", orderId)

    const response = await fetch(`https://api.remonline.ru/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "DeviceHelp/1.0",
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log("✅ Order fetched successfully")
      return NextResponse.json({
        success: true,
        message: "Order fetched successfully",
        data: {
          order: data,
          order_id: orderId,
          fetch_time: new Date().toISOString(),
        },
      })
    } else {
      console.error("❌ Failed to fetch order:", data)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch order",
        details: {
          status: response.status,
          response: data,
          order_id: orderId,
        },
      })
    }
  } catch (error) {
    console.error("💥 Order fetch error:", error)
    return NextResponse.json({
      success: false,
      error: "Order fetch failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

async function fetchClient(apiKey: string, apiToken: string, clientId: string) {
  try {
    console.log("👤 Fetching client:", clientId)

    const response = await fetch(`https://api.remonline.ru/clients/${clientId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "DeviceHelp/1.0",
      },
    })

    const data = await response.json()

    if (response.ok) {
      console.log("✅ Client fetched successfully")
      return NextResponse.json({
        success: true,
        message: "Client fetched successfully",
        data: {
          client: data,
          client_id: clientId,
          fetch_time: new Date().toISOString(),
        },
      })
    } else {
      console.error("❌ Failed to fetch client:", data)
      return NextResponse.json({
        success: false,
        error: "Failed to fetch client",
        details: {
          status: response.status,
          response: data,
          client_id: clientId,
        },
      })
    }
  } catch (error) {
    console.error("💥 Client fetch error:", error)
    return NextResponse.json({
      success: false,
      error: "Client fetch failed",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
