import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { handleOrderEvents } from "./handlers/order-handler"
import { handleClientEvents } from "./handlers/client-handler"

// This is the secret key that RemOnline will use to authenticate the webhook
const WEBHOOK_SECRET = process.env.REMONLINE_WEBHOOK_SECRET || "your-webhook-secret"

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
    console.log("RemOnline webhook received:", JSON.stringify(payload, null, 2))

    // Validate the webhook payload against the schema
    const parsedPayload = remonlineWebhookSchema.safeParse(payload)

    if (!parsedPayload.success) {
      console.error("Invalid webhook payload:", parsedPayload.error)
      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsedPayload.error.errors },
        { status: 400 },
      )
    }

    const webhookData = parsedPayload.data
    const eventType = webhookData.event_name || ""

    console.log(`Processing event: ${eventType}`)

    // Route events to appropriate handlers
    if (eventType.startsWith("Order.")) {
      return await handleOrderEvents(webhookData)
    }

    if (eventType.startsWith("Client.")) {
      return await handleClientEvents(webhookData)
    }

    // Handle other event types as needed
    console.log(`Unhandled event type: ${eventType}`)
    return NextResponse.json({ success: true, message: "Webhook received but no action taken" })
  } catch (error) {
    console.error("Error processing RemOnline webhook:", error)
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
