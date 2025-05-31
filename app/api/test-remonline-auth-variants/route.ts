import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Testing RemOnline authentication with different variants...")

    // Log environment variables (without revealing full values)
    const apiKey = process.env.REMONLINE_API_KEY || ""
    const apiToken = process.env.REMONLINE_API_TOKEN || ""

    console.log("Environment variables check:")
    console.log("REMONLINE_API_KEY exists:", !!apiKey)
    console.log("REMONLINE_API_TOKEN exists:", !!apiToken)

    if (apiKey) {
      console.log("REMONLINE_API_KEY first 5 chars:", apiKey.substring(0, 5) + "...")
    }

    if (apiToken) {
      console.log("REMONLINE_API_TOKEN first 5 chars:", apiToken.substring(0, 5) + "...")
    }

    // Try different variants of the request
    const results = await Promise.all([
      // Variant 1: Standard request with api_key
      testVariant("Standard request with api_key", {
        api_key: apiKey,
      }),

      // Variant 2: Try with apiKey instead of api_key
      testVariant("Using apiKey instead of api_key", {
        apiKey: apiKey,
      }),

      // Variant 3: Try with both api_key and apiKey
      testVariant("Using both api_key and apiKey", {
        api_key: apiKey,
        apiKey: apiKey,
      }),

      // Variant 4: Try with API token as api_key
      testVariant("Using API token as api_key", {
        api_key: apiToken,
      }),

      // Variant 5: Try with trimmed API key
      testVariant("Using trimmed API key", {
        api_key: apiKey.trim(),
      }),

      // Variant 6: Try with different content-type
      testVariant(
        "Using different content-type",
        {
          api_key: apiKey,
        },
        {
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
      ),

      // Variant 7: Try with x-www-form-urlencoded body
      testVariantFormUrlEncoded("Using x-www-form-urlencoded", {
        api_key: apiKey,
      }),
    ])

    return NextResponse.json({
      results,
    })
  } catch (error) {
    console.error("Error in test-remonline-auth-variants route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing RemOnline authentication variants",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function testVariant(name: string, body: any, headers: Record<string, string> = {}) {
  try {
    console.log(`Testing variant: ${name}`)
    console.log("Request body:", { ...body, api_key: body.api_key ? body.api_key.substring(0, 5) + "..." : undefined })

    const response = await fetch("https://api.remonline.app/token/new", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()
    console.log(`Response status for ${name}: ${response.status}`)

    let data
    try {
      data = JSON.parse(responseText)
      console.log(`Response data for ${name}:`, data)
    } catch (e) {
      console.error(`Failed to parse response as JSON for ${name}:`, responseText)
      data = { error: "Failed to parse response as JSON", text: responseText }
    }

    return {
      name,
      success: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    console.error(`Error testing variant ${name}:`, error)
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function testVariantFormUrlEncoded(name: string, params: any) {
  try {
    console.log(`Testing variant: ${name}`)

    const formData = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    console.log(
      "Request form data:",
      formData.toString().replace(params.api_key, params.api_key.substring(0, 5) + "..."),
    )

    const response = await fetch("https://api.remonline.app/token/new", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    const responseText = await response.text()
    console.log(`Response status for ${name}: ${response.status}`)

    let data
    try {
      data = JSON.parse(responseText)
      console.log(`Response data for ${name}:`, data)
    } catch (e) {
      console.error(`Failed to parse response as JSON for ${name}:`, responseText)
      data = { error: "Failed to parse response as JSON", text: responseText }
    }

    return {
      name,
      success: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    console.error(`Error testing variant ${name}:`, error)
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
