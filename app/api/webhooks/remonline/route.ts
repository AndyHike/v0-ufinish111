import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let webhookData: any = null
  let rawBody = ""

  try {
    // Get raw body for logging
    rawBody = await request.text()
    console.log("🔔 RAW WEBHOOK RECEIVED:")
    console.log("📋 Headers:", Object.fromEntries(request.headers.entries()))
    console.log("📋 Raw Body:", rawBody)
    console.log("📋 Content-Type:", request.headers.get("content-type"))
    console.log("📋 User-Agent:", request.headers.get("user-agent"))

    // Try to parse JSON
    try {
      webhookData = JSON.parse(rawBody)
      console.log("✅ JSON parsed successfully:", webhookData)
    } catch (parseError) {
      console.log("❌ JSON parse failed:", parseError)
      webhookData = { raw_body: rawBody, parse_error: String(parseError) }
    }

    // Log EVERYTHING to database immediately - no filtering
    await logWebhook(webhookData, "received", "Raw webhook received", 0, {
      headers: Object.fromEntries(request.headers.entries()),
      raw_body: rawBody,
      content_type: request.headers.get("content-type"),
      user_agent: request.headers.get("user-agent"),
    })

    // Extract event type from various possible fields
    const eventType =
      webhookData?.event_name ||
      webhookData?.event ||
      webhookData?.type ||
      webhookData?.eventType ||
      webhookData?.action ||
      "unknown_event"

    console.log(`🎯 Event type detected: ${eventType}`)

    const processingTime = Date.now() - startTime

    // Always return success to not break RemOnline
    const result = {
      success: true,
      message: `Webhook received and logged (${eventType})`,
      processingTime: processingTime,
      eventType: eventType,
      timestamp: new Date().toISOString(),
    }

    console.log(`✅ Webhook processed in ${processingTime}ms`)

    // Log successful processing
    await logWebhook(webhookData, "success", result.message, processingTime)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("💥 WEBHOOK ERROR:", error)

    // Log error with all available data
    await logWebhook(
      webhookData || { raw_body: rawBody },
      "error",
      error instanceof Error ? error.message : String(error),
      processingTime,
    )

    // Still return 200 to not break RemOnline
    return NextResponse.json(
      {
        success: false,
        error: "Internal processing error",
        message: "Webhook received but processing failed",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}

export async function GET() {
  console.log("🔍 GET request to webhook endpoint")

  // Log GET request too
  await logWebhook(
    { method: "GET", timestamp: new Date().toISOString() },
    "received",
    "GET request to webhook endpoint",
  )

  return NextResponse.json({
    status: "active",
    message: "RemOnline webhook endpoint is working",
    timestamp: new Date().toISOString(),
    url: "https://devicehelp.cz/api/webhooks/remonline",
    methods: ["GET", "POST"],
  })
}

async function logWebhook(
  webhookData: any,
  status: "received" | "success" | "failed" | "error",
  message?: string,
  processingTime?: number,
  metadata?: any,
) {
  try {
    const supabase = createClient()

    const logEntry = {
      event_type:
        webhookData?.event_name ||
        webhookData?.event ||
        webhookData?.type ||
        webhookData?.eventType ||
        webhookData?.action ||
        (webhookData?.method === "GET" ? "GET_REQUEST" : "unknown"),
      status,
      message: message || "",
      processing_time_ms: processingTime || 0,
      webhook_data: {
        ...webhookData,
        ...(metadata && { _metadata: metadata }),
      },
      created_at: new Date().toISOString(),
    }

    console.log("💾 Logging to database:", {
      event_type: logEntry.event_type,
      status: logEntry.status,
      message: logEntry.message,
    })

    const { data, error } = await supabase.from("webhook_logs").insert([logEntry]).select()

    if (error) {
      console.error("❌ Database log failed:", error)
    } else {
      console.log("✅ Database log success:", data?.[0]?.id)
    }
  } catch (error) {
    console.error("💥 Logging error:", error)
  }
}
