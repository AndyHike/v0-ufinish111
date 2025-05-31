import { NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET() {
  try {
    console.log("Testing Remonline API connection...")
    console.log("API Token:", process.env.REMONLINE_API_TOKEN ? "Token exists" : "No token provided")

    if (!process.env.REMONLINE_API_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          message: "REMONLINE_API_TOKEN environment variable is not set",
        },
        { status: 400 },
      )
    }

    // Test authentication
    const authResult = await remonline.auth(process.env.REMONLINE_API_TOKEN)
    console.log("Auth result:", authResult)

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication failed",
          details: authResult,
        },
        { status: 401 },
      )
    }

    // Test getting clients with a smaller limit to avoid large responses
    const clientsResult = await remonline.getClients({ limit: 5 })

    return NextResponse.json({
      success: true,
      auth: authResult,
      clients: clientsResult.success
        ? {
            count: clientsResult.data.data?.length || 0,
            success: true,
            sample: clientsResult.data.data?.slice(0, 2) || [],
          }
        : { success: false, details: clientsResult },
    })
  } catch (error) {
    console.error("Error testing Remonline API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing Remonline API",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
