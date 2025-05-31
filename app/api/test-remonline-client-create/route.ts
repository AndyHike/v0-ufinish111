import { NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET() {
  try {
    console.log("Testing RemOnline client creation...")

    // Step 1: Authenticate
    console.log("Step 1: Authenticating with RemOnline API")
    const authResult = await remonline.auth()

    if (!authResult.success) {
      console.error("Authentication failed:", authResult)
      return NextResponse.json(
        {
          success: false,
          step: "authentication",
          error: authResult,
        },
        { status: 500 },
      )
    }

    console.log("Authentication successful!")

    // Generate a unique email to avoid conflicts
    const timestamp = new Date().getTime()
    const testEmail = `test${timestamp}@example.com`

    // Step 2: Create a test client with the exact format from the example
    console.log("Step 2: Creating test client")
    const createResult = await remonline.createClient({
      first_name: "Test",
      last_name: "User",
      email: testEmail,
      phone: ["775848259"], // Exact format from the example
      address: "Test Address",
    })

    if (!createResult.success) {
      console.error("Client creation failed:", createResult)
      return NextResponse.json(
        {
          success: false,
          step: "client_creation",
          error: createResult,
        },
        { status: 500 },
      )
    }

    console.log("Client creation successful!")

    return NextResponse.json({
      success: true,
      message: "RemOnline client creation test completed successfully",
      steps: {
        authentication: true,
        client_creation: true,
      },
      client: createResult.client,
    })
  } catch (error) {
    console.error("Error in test-remonline-client-create route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing RemOnline client creation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
