import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let webhookData: any = null

  try {
    // Parse the webhook data
    webhookData = await request.json()
    console.log("🔔 RemOnline webhook received:")
    console.log("📋 Headers:", Object.fromEntries(request.headers.entries()))
    console.log("📋 Payload:", JSON.stringify(webhookData, null, 2))

    // Log webhook to database immediately for monitoring
    await logWebhook(webhookData, "received", "Webhook received successfully")

    // Extract event type - RemOnline might use different field names
    const eventType = webhookData.event_name || webhookData.event || webhookData.type || "unknown"

    if (!eventType || eventType === "unknown") {
      console.error("❌ No event type found in webhook")
      await logWebhook(webhookData, "failed", "No event type found")
      return NextResponse.json({ error: "No event type found" }, { status: 400 })
    }

    console.log(`🎯 Processing event: ${eventType}`)

    // For now, just log all events as successful to test monitoring
    const processingTime = Date.now() - startTime
    const result = {
      success: true,
      message: `Event ${eventType} received and logged successfully`,
      processingTime: processingTime,
    }

    console.log(`✅ Webhook processed in ${processingTime}ms:`, result)

    // Log successful processing
    await logWebhook(webhookData, "success", result.message, processingTime)

    return NextResponse.json(result)
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("💥 Webhook processing error:", error)

    // Log error
    await logWebhook(webhookData, "error", error instanceof Error ? error.message : String(error), processingTime)

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  // Handle GET requests for webhook verification
  return NextResponse.json({
    message: "RemOnline webhook endpoint is active",
    timestamp: new Date().toISOString(),
    url: "https://devicehelp.cz/api/webhooks/remonline",
  })
}

async function logWebhook(
  webhookData: any,
  status: "received" | "success" | "failed" | "error",
  message?: string,
  processingTime?: number,
) {
  try {
    const supabase = createClient()

    const logEntry = {
      event_type: webhookData?.event_name || webhookData?.event || webhookData?.type || "unknown",
      status,
      message: message || "",
      processing_time_ms: processingTime || 0,
      webhook_data: webhookData,
      created_at: new Date().toISOString(),
    }

    console.log("💾 Logging webhook to database:", logEntry)

    const { data, error } = await supabase.from("webhook_logs").insert([logEntry]).select()

    if (error) {
      console.error("❌ Failed to log webhook:", error)
    } else {
      console.log("✅ Webhook logged successfully:", data)
    }
  } catch (error) {
    console.error("💥 Error logging webhook:", error)
  }
}
