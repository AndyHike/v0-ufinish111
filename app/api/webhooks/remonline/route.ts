import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { handleOrderEvents } from "./handlers/order-handler"
import { handleClientEvents } from "./handlers/client-handler"
import { createClient } from "@/lib/supabase/server"

// Different secret keys for different webhook types
const ORDER_WEBHOOK_SECRET = process.env.REMONLINE_ORDER_WEBHOOK_SECRET || "your-order-webhook-secret"
const GENERAL_WEBHOOK_SECRET = process.env.REMONLINE_WEBHOOK_SECRET || "your-webhook-secret"

// Define a schema for the RemOnline webhook payload
const remonlineWebhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  event_name: z.string(),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  metadata: z
    .object({
      order: z
        .object({
          id: z.number(),
          name: z.string(),
          type: z.number().optional(),
        })
        .optional(),
      client: z
        .object({
          id: z.number(),
          fullname: z.string(),
        })
        .optional(),
      status: z
        .object({
          id: z.number(),
        })
        .optional(),
      asset: z
        .object({
          id: z.number(),
          name: z.string(),
        })
        .optional(),
    })
    .optional(),
  employee: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
  }),
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let webhookData: any = null

  try {
    // Parse the webhook data
    webhookData = await request.json()
    console.log("🔔 Webhook received:", JSON.stringify(webhookData, null, 2))

    // Log webhook to database for real-time monitoring
    await logWebhook(webhookData, "received")

    // Validate webhook signature for security
    const signature = request.headers.get("x-remonline-signature")
    if (!validateWebhookSignature(webhookData, signature)) {
      console.error("❌ Invalid webhook signature")
      await logWebhook(webhookData, "failed", "Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Extract event type
    const eventType = webhookData.event_name || ""
    if (!eventType) {
      console.error("❌ No event type in webhook")
      await logWebhook(webhookData, "failed", "No event type")
      return NextResponse.json({ error: "No event type" }, { status: 400 })
    }

    console.log(`🎯 Processing event: ${eventType}`)

    let result: any = { success: false, message: "Unknown event type" }

    // Route to appropriate handler based on event type
    if (eventType.startsWith("Order.")) {
      result = await handleOrderEvents(webhookData)
    } else if (eventType.startsWith("Client.")) {
      result = await handleClientEvents(webhookData)
    } else {
      console.log(`⚠️ Unhandled event type: ${eventType}`)
      result = { success: true, message: `Event ${eventType} received but not processed` }
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ Webhook processed in ${processingTime}ms:`, result)

    // Log successful processing
    await logWebhook(webhookData, result.success ? "success" : "failed", result.message, processingTime)

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

function validateWebhookSignature(data: any, signature: string | null): boolean {
  // For testing, allow test signatures
  if (signature === "test-signature") {
    console.log("🧪 Test signature detected, skipping validation")
    return true
  }

  // Implement your actual signature validation logic here
  const expectedSecret = process.env.REMONLINE_ORDER_WEBHOOK_SECRET
  if (!expectedSecret) {
    console.error("❌ REMONLINE_ORDER_WEBHOOK_SECRET not configured")
    return false
  }

  // Add your signature validation logic here
  // This is a placeholder - implement according to RemOnline's documentation
  return true
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
      event_type: webhookData?.event_name || "unknown",
      status,
      message: message || "",
      processing_time_ms: processingTime || 0,
      webhook_data: webhookData,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("webhook_logs").insert([logEntry])

    if (error) {
      console.error("Failed to log webhook:", error)
    }
  } catch (error) {
    console.error("Error logging webhook:", error)
  }
}
