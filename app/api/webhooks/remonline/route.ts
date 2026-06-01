import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { handleOrderEvents } from "./handlers/order-handler"
import { handleClientEvents } from "./handlers/client-handler"
import { handleInvoiceEvents } from "./handlers/invoice-handler"
import webhookSecurity from "@/lib/api/remonline-webhook-security"

const { verifyRemonlineWebhookSignature } = webhookSecurity

const REMONLINE_WEBHOOK_SECRET = process.env.REMONLINE_WEBHOOK_SECRET || ""

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
      // For Order.Created and Order.Updated
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
      // For Order.Status.Changed
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
      invoice: z
        .object({
          id: z.number().optional(),
          number: z.string().optional(),
          name: z.string().optional(),
          status: z
            .object({
              id: z.number().optional(),
              name: z.string().optional(),
              title: z.string().optional(),
              group: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      payer: z
        .object({
          id: z.number().optional(),
          fullname: z.string().optional(),
          name: z.string().optional(),
          full_name: z.string().optional(),
        })
        .passthrough()
        .optional(),
      manager: z
        .object({
          id: z.number().optional(),
          full_name: z.string().optional(),
          name: z.string().optional(),
        })
        .passthrough()
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
    const payloadText = await request.text()
    let payload: any

    try {
      payload = JSON.parse(payloadText)
    } catch (error) {
      console.error("Invalid RemOnline webhook JSON:", error)
      return NextResponse.json({ success: false, error: "Invalid webhook JSON" }, { status: 400 })
    }

    const signature = request.headers.get("x-signature") || request.headers.get("X-Signature")

    if (!REMONLINE_WEBHOOK_SECRET) {
      console.error("REMONLINE_WEBHOOK_SECRET is not configured")
      return NextResponse.json({ success: false, error: "Webhook secret is not configured" }, { status: 500 })
    }

    if (!verifyRemonlineWebhookSignature({ payload, signature, secret: REMONLINE_WEBHOOK_SECRET })) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 })
    }

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

    // Validate the webhook payload against the schema
    const parsedPayload = remonlineWebhookSchema.safeParse(payload)

    if (!parsedPayload.success) {
      console.error("❌ Invalid webhook payload:", parsedPayload.error)
      console.error("❌ Validation errors:", JSON.stringify(parsedPayload.error.issues, null, 2))

      // For Order.Status.Changed, let's try to process it anyway if it has the basic structure
      if (payload.event_name === "Order.Status.Changed" && payload.context?.object_id && payload.metadata?.new?.id) {
        console.log("⚠️ Validation failed but trying to process Order.Status.Changed anyway...")
        const webhookData = payload
        const eventType = webhookData.event_name || ""

        console.log(`🎯 Processing event: ${eventType}`)
        console.log(`📊 Context:`, webhookData.context)
        console.log(`📝 Metadata:`, webhookData.metadata)

        if (eventType.startsWith("Order.")) {
          console.log("📦 Routing to order handler...")
          return await handleOrderEvents(webhookData)
        }
      }

      if (
        typeof payload.event_name === "string" &&
        payload.event_name.startsWith("Order.") &&
        payload.context?.object_id != null
      ) {
        console.log("Validation failed but trying to process sparse Order webhook anyway...")
        return await handleOrderEvents(payload)
      }

      if (
        typeof payload.event_name === "string" &&
        payload.event_name.startsWith("Invoice.") &&
        (payload.context?.object_id != null || payload.metadata?.invoice?.id != null)
      ) {
        console.log("Validation failed but trying to process sparse Invoice webhook anyway...")
        return await handleInvoiceEvents(payload)
      }

      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsedPayload.error.issues },
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

    if (eventType.startsWith("Invoice.")) {
      console.log("Routing to invoice handler...")
      return await handleInvoiceEvents(webhookData)
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
