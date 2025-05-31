import { NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET() {
  try {
    console.log("Testing RemOnline authentication...")

    // Log environment variables (without revealing full values)
    console.log("Environment variables check:")
    console.log("REMONLINE_API_KEY exists:", !!process.env.REMONLINE_API_KEY)
    console.log("REMONLINE_API_TOKEN exists:", !!process.env.REMONLINE_API_TOKEN)

    if (process.env.REMONLINE_API_KEY) {
      console.log("REMONLINE_API_KEY first 5 chars:", process.env.REMONLINE_API_KEY.substring(0, 5) + "...")
    }

    if (process.env.REMONLINE_API_TOKEN) {
      console.log("REMONLINE_API_TOKEN first 5 chars:", process.env.REMONLINE_API_TOKEN.substring(0, 5) + "...")
    }

    // Try to authenticate
    const authResult = await remonline.auth()

    if (!authResult.success) {
      console.error("Authentication failed:", authResult)
      return NextResponse.json(
        {
          success: false,
          message: "Authentication failed",
          details: authResult,
        },
        { status: 500 },
      )
    }

    console.log("Authentication successful!")

    // Try to get some clients as a test
    const clientsResult = await remonline.getClients({ limit: 1 })

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      token: authResult.token ? authResult.token.substring(0, 5) + "..." : null,
      clientsTest: clientsResult.success ? "Successful" : "Failed",
      clientsDetails: clientsResult.success ? { count: clientsResult.data?.count || 0 } : clientsResult,
    })
  } catch (error) {
    console.error("Error in test-remonline-auth route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing RemOnline authentication",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
