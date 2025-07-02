import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("[WEBHOOK] 🔔 GET REQUEST RECEIVED!")
  console.log("[WEBHOOK] 📍 URL:", request.url)
  console.log("[WEBHOOK] 🕐 Timestamp:", new Date().toISOString())

  // Log to database
  try {
    const supabase = createClient()
    await supabase.from("webhook_logs").insert({
      method: "GET",
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      raw_body: "",
      payload: { message: "GET request to webhook endpoint" },
      user_agent: request.headers.get("user-agent") || "",
      content_type: request.headers.get("content-type") || "",
      created_at: new Date().toISOString(),
    })
    console.log("[WEBHOOK] ✅ GET request logged to database")
  } catch (error) {
    console.error("[WEBHOOK] ❌ Failed to log GET request:", error)
  }

  return NextResponse.json({
    status: "active",
    ready_for_webhooks: true,
    endpoint: "/api/webhooks/remonline",
    methods: ["GET", "POST"],
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] 🔔 POST REQUEST RECEIVED!")
  console.log("[WEBHOOK] 📍 URL:", request.url)
  console.log("[WEBHOOK] 🕐 Timestamp:", new Date().toISOString())

  let rawBody = ""
  let payload = null
  let headers = {}

  try {
    // Get headers
    headers = Object.fromEntries(request.headers.entries())
    console.log("[WEBHOOK] 📋 Headers:", JSON.stringify(headers, null, 2))

    // Get raw body
    rawBody = await request.text()
    console.log("[WEBHOOK] 📦 Raw Body:", rawBody)
    console.log("[WEBHOOK] 📏 Body Length:", rawBody.length)

    // Try to parse JSON
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody)
        console.log("[WEBHOOK] ✅ JSON Parsed Successfully")
        console.log("[WEBHOOK] 🎯 Payload:", JSON.stringify(payload, null, 2))
      } catch (parseError) {
        console.log("[WEBHOOK] ⚠️ JSON Parse Failed:", parseError)
        payload = { raw_data: rawBody, parse_error: String(parseError) }
      }
    } else {
      console.log("[WEBHOOK] ⚠️ Empty body received")
      payload = { message: "Empty body received" }
    }

    // Log to database
    const supabase = createClient()
    const logEntry = {
      method: "POST",
      url: request.url,
      headers: headers,
      raw_body: rawBody,
      payload: payload,
      user_agent: request.headers.get("user-agent") || "",
      content_type: request.headers.get("content-type") || "",
      created_at: new Date().toISOString(),
    }

    console.log("[WEBHOOK] 💾 Saving to database...")
    const { data, error } = await supabase.from("webhook_logs").insert(logEntry).select()

    if (error) {
      console.error("[WEBHOOK] ❌ Database Error:", error)
    } else {
      console.log("[WEBHOOK] ✅ Successfully saved to database:", data)
    }
  } catch (error) {
    console.error("[WEBHOOK] 💥 Unexpected Error:", error)
  }

  // Always return 200 OK
  console.log("[WEBHOOK] 📤 Returning 200 OK")
  return NextResponse.json(
    {
      success: true,
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
      received_data: payload ? "parsed" : "raw",
    },
    { status: 200 },
  )
}

export async function OPTIONS(request: NextRequest) {
  console.log("[WEBHOOK] 🔔 OPTIONS REQUEST RECEIVED!")
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
