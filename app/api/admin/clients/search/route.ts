import { NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get("type")
    const identifier = url.searchParams.get("identifier")

    if (!type || !identifier) {
      return NextResponse.json({ success: false, message: "Missing type or identifier parameter" }, { status: 400 })
    }

    if (type !== "email" && type !== "phone") {
      return NextResponse.json(
        { success: false, message: "Invalid type parameter. Must be 'email' or 'phone'" },
        { status: 400 },
      )
    }

    // Authenticate with Remonline API
    const authResult = await remonline.auth(process.env.REMONLINE_API_TOKEN)
    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to authenticate with Remonline API",
          details: authResult,
        },
        { status: 401 },
      )
    }

    // Search for client
    let result
    if (type === "email") {
      result = await remonline.getClientByEmail(identifier)
    } else {
      result = await remonline.getClientByPhone(identifier)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error searching client:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error searching client",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
