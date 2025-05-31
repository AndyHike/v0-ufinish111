import { NextResponse } from "next/server"
import remonline from "@/lib/api/remonline"

export async function GET() {
  try {
    console.log("Testing full RemOnline integration flow...")

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

    // Step 2: Search for a test client
    console.log("Step 2: Searching for test client")
    const testEmail = "test@example.com"
    const clientSearchResult = await remonline.getClientByEmail(testEmail)

    console.log("Client search result:", clientSearchResult)

    // Step 3: Create a test client if it doesn't exist
    let clientId
    if (clientSearchResult.success && clientSearchResult.exists && clientSearchResult.client) {
      console.log("Test client already exists, skipping creation")
      clientId = clientSearchResult.client.id
    } else {
      console.log("Step 3: Creating test client")
      const createResult = await remonline.createClient({
        first_name: "Test",
        last_name: "User",
        email: testEmail,
        phone: ["+380123456789"],
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
      clientId = createResult.client.id
    }

    return NextResponse.json({
      success: true,
      message: "Full RemOnline integration test completed successfully",
      steps: {
        authentication: true,
        client_search: true,
        client_creation: clientId ? true : "skipped",
      },
      clientId,
    })
  } catch (error) {
    console.error("Error in test-remonline-full route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing RemOnline integration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
