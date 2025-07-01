import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RemOnlineWebhookData {
  id: string
  created_at: string
  event_name: string
  context: {
    object_id: number
    object_type: string
  }
  metadata?: {
    order?: {
      id: number
      name: string
      type?: number
    }
    client?: {
      id: number
      fullname: string
    }
    status?: {
      id: number
    }
    asset?: {
      id: number
      name: string
    }
  }
  employee: {
    id: number
    full_name: string
    email: string
  }
}

export async function handleOrderEvents(webhookData: RemOnlineWebhookData) {
  try {
    console.log(`🔄 Processing order event: ${webhookData.event_name}`)

    const supabase = createClient()
    const eventType = webhookData.event_name
    const orderId = webhookData.context.object_id

    // Handle different order events
    switch (eventType) {
      case "Order.Created":
        return await handleOrderCreated(supabase, webhookData)

      case "Order.Updated":
        return await handleOrderUpdated(supabase, webhookData)

      case "Order.StatusChanged":
        return await handleOrderStatusChanged(supabase, webhookData)

      case "Order.Deleted":
        return await handleOrderDeleted(supabase, webhookData)

      default:
        console.log(`⚠️ Unhandled order event: ${eventType}`)
        return NextResponse.json({
          success: true,
          message: `Order event ${eventType} received but not processed`,
        })
    }
  } catch (error) {
    console.error("💥 Error handling order event:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process order event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleOrderCreated(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("📝 Handling Order.Created event")

  // Here you would typically:
  // 1. Fetch full order details from RemOnline API
  // 2. Store order in your database
  // 3. Send notifications if needed

  return NextResponse.json({
    success: true,
    message: "Order created event processed",
  })
}

async function handleOrderUpdated(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("📝 Handling Order.Updated event")

  // Handle order updates
  return NextResponse.json({
    success: true,
    message: "Order updated event processed",
  })
}

async function handleOrderStatusChanged(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("📝 Handling Order.StatusChanged event")

  // Handle status changes
  return NextResponse.json({
    success: true,
    message: "Order status changed event processed",
  })
}

async function handleOrderDeleted(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("📝 Handling Order.Deleted event")

  // Handle order deletion
  return NextResponse.json({
    success: true,
    message: "Order deleted event processed",
  })
}
