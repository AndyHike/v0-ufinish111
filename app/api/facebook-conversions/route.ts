import { type NextRequest, NextResponse } from "next/server"

const FACEBOOK_PIXEL_ID = "1823195131746594"
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN // Додайте в .env

export async function POST(request: NextRequest) {
  try {
    const { event, data, userAgent, ip } = await request.json()

    // Facebook Conversions API payload
    const payload = {
      data: [
        {
          event_name: event,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_source_url: data.url || "",
          user_data: {
            client_ip_address: ip || request.ip,
            client_user_agent: userAgent || request.headers.get("user-agent"),
            fbp: data.fbp || undefined,
            fbc: data.fbc || undefined,
          },
          custom_data: data.customData || {},
        },
      ],
    }

    // Відправляємо до Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FACEBOOK_PIXEL_ID}/events?access_token=${FACEBOOK_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    const result = await response.json()

    if (!response.ok) {
      console.error("Facebook Conversions API error:", result)
      return NextResponse.json({ error: "Facebook API error" }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Server-side tracking error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
