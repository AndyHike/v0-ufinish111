import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { endpoint, id } = await request.json()

    if (!endpoint || !id) {
      return NextResponse.json({ error: "Missing endpoint or id parameter" }, { status: 400 })
    }

    const apiKey = process.env.REMONLINE_API_KEY
    const apiToken = process.env.REMONLINE_API_TOKEN

    if (!apiKey) {
      return NextResponse.json({ error: "RemOnline API key not configured" }, { status: 500 })
    }

    console.log(`🧪 Testing RemOnline API: ${endpoint}/${id}`)

    // Construct the RemOnline API URL
    const apiUrl = `https://api.remonline.app/token/${apiKey}/${endpoint}/${id}`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DeviceHelp-Integration/1.0",
        ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
      },
    })

    const data = await response.json()

    console.log(`✅ RemOnline API response:`, {
      status: response.status,
      ok: response.ok,
      dataKeys: Object.keys(data || {}),
    })

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      endpoint: `${endpoint}/${id}`,
      data: data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 RemOnline API test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
