import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { handleOrderEvents } from "./handlers/order-handler"
import { handleClientEvents } from "./handlers/client-handler"

// Enhanced webhook schema to support Order.Status.Changed
const webhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  event_name: z.string(),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  metadata: z.object({
    client: z
      .object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
    status: z
      .object({
        id: z.number(),
      })
      .optional(),
    // Support for Order.Status.Changed
    new: z
      .object({
        id: z.number(),
      })
      .optional(),
    old: z
      .object({
        id: z.number(),
      })
      .optional(),
    order: z
      .object({
        id: z.number(),
        name: z.string().optional(),
      })
      .optional(),
  }),
  employee: z
    .object({
      id: z.number(),
      full_name: z.string(),
      email: z.string(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 Webhook received")

    const body = await request.json()
    console.log("📋 Webhook body:", JSON.stringify(body, null, 2))

    // Validate webhook signature if needed
    const signature = request.headers.get("x-signature")
    const webhookId = request.headers.get("x-webhook-id")
    const eventName = request.headers.get("x-event")

    console.log("🔐 Headers:", { signature, webhookId, eventName })

    // Try to validate with main schema
    let webhookData
    try {
      webhookData = webhookSchema.parse(body)
      console.log("✅ Webhook validation successful")
    } catch (validationError) {
      console.log("❌ Main validation failed:", validationError)

      // Special handling for Order.Status.Changed if main validation fails
      if (body.event_name === "Order.Status.Changed" && body.metadata?.new?.id && body.context?.object_id) {
        console.log("🔄 Using fallback validation for Order.Status.Changed")
        webhookData = body
      } else {
        console.error("❌ Webhook validation failed:", validationError)
        return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
      }
    }

    console.log("🎯 Processing event:", webhookData.event_name)

    // Route to appropriate handler based on event type
    if (webhookData.event_name.startsWith("Order.")) {
      console.log("📦 Routing to order handler")
      await handleOrderEvents(webhookData)
    } else if (webhookData.event_name.startsWith("Client.")) {
      console.log("👤 Routing to client handler")
      await handleClientEvents(webhookData)
    } else {
      console.log("❓ Unknown event type:", webhookData.event_name)
    }

    console.log("✅ Webhook processed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("💥 Webhook processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
