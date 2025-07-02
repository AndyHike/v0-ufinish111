import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { handleOrderEvents } from "./handlers/order-handler"
import { handleClientEvents } from "./handlers/client-handler"

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
  try {
    // Clone request for logging
    const clonedRequest = request.clone()
    const payload = await clonedRequest.json()

    console.log("🔔 RemOnline webhook received:")
    console.log("📋 Payload:", JSON.stringify(payload, null, 2))

    // Спеціальне логування для Order.Status.Changed
    if (payload.event_name === "Order.Status.Changed") {
      console.log("🔄 SPECIAL LOG - Order.Status.Changed detected!")
      console.log("📊 Order ID:", payload.context?.object_id)
      console.log("📊 New Status ID:", payload.metadata?.new?.id)
      console.log("📊 Old Status ID:", payload.metadata?.old?.id)
      console.log("📊 Order Name:", payload.metadata?.order?.name)
    }

    console.log("🔑 Available secrets:")
    console.log("   - ORDER_WEBHOOK_SECRET:", ORDER_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing")
    console.log("   - GENERAL_WEBHOOK_SECRET:", GENERAL_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing")

    // Validate the webhook payload against the schema
    const parsedPayload = remonlineWebhookSchema.safeParse(payload)

    if (!parsedPayload.success) {
      console.error("❌ Invalid webhook payload:", parsedPayload.error)
      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsedPayload.error.errors },
        { status: 400 },
      )
    }

    const webhookData = parsedPayload.data
    const eventType = webhookData.event_name || ""

    console.log(`🎯 Processing event: ${eventType}`)
    console.log(`📊 Context:`, webhookData.context)
    console.log(`📝 Metadata:`, webhookData.metadata)

    // Route events to appropriate handlers
    if (eventType.startsWith("Order.")) {
      console.log("📦 Routing to order handler...")
      return await handleOrderEvents(webhookData)
    }

    if (eventType.startsWith("Client.")) {
      console.log("👤 Routing to client handler...")
      return await handleClientEvents(webhookData)
    }

    // Handle other event types as needed
    console.log(`⚠️ Unhandled event type: ${eventType}`)
    return NextResponse.json({ success: true, message: "Webhook received but no action taken" })
  } catch (error) {
    console.error("💥 Error processing RemOnline webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
