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
    client?: {
      id: number
      fullname: string
    }
  }
  employee: {
    id: number
    full_name: string
    email: string
  }
}

export async function handleClientEvents(webhookData: RemOnlineWebhookData) {
  try {
    console.log(`👤 Processing client event: ${webhookData.event_name}`)

    const supabase = createClient()
    const eventType = webhookData.event_name

    // Handle different client events
    switch (eventType) {
      case "Client.Created":
        return await handleClientCreated(supabase, webhookData)

      case "Client.Updated":
        return await handleClientUpdated(supabase, webhookData)

      case "Client.Deleted":
        return await handleClientDeleted(supabase, webhookData)

      default:
        console.log(`⚠️ Unhandled client event: ${eventType}`)
        return NextResponse.json({
          success: true,
          message: `Client event ${eventType} received but not processed`,
        })
    }
  } catch (error) {
    console.error("💥 Error handling client event:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process client event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientCreated(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("👤 Handling Client.Created event")

  // Handle client creation
  return NextResponse.json({
    success: true,
    message: "Client created event processed",
  })
}

async function handleClientUpdated(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("👤 Handling Client.Updated event")

  // Handle client updates
  return NextResponse.json({
    success: true,
    message: "Client updated event processed",
  })
}

async function handleClientDeleted(supabase: any, webhookData: RemOnlineWebhookData) {
  console.log("👤 Handling Client.Deleted event")

  // Handle client deletion
  return NextResponse.json({
    success: true,
    message: "Client deleted event processed",
  })
}
