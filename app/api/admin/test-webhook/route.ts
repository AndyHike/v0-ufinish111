import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { webhookData } = await request.json()

    console.log("🧪 Testing webhook with data:", JSON.stringify(webhookData, null, 2))

    // Forward the test data to the actual webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/remonline`

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-remonline-signature": "test-signature", // This will be validated
      },
      body: JSON.stringify(webhookData),
    })

    const responseData = await response.text()

    console.log("🧪 Webhook response status:", response.status)
    console.log("🧪 Webhook response data:", responseData)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseData,
      message: response.ok ? "Webhook test successful" : "Webhook test failed",
    })
  } catch (error) {
    console.error("🧪 Webhook test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Webhook test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
