import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { ClientService } from "../services/client-service"

function clientWebhookProcessingErrorResponse(error: unknown, message: string) {
  return NextResponse.json(
    {
      success: false,
      ignored: true,
      error: message,
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 200 },
  )
}

export async function handleClientEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    console.log(`👤 Handling client event: ${eventType}`)

    switch (eventType) {
      case "Client.Created":
        return await handleClientCreated(webhookData)
      case "Client.Updated":
        return await handleClientUpdated(webhookData)
      case "Client.Deleted":
        return await handleClientDeleted(webhookData)
      default:
        console.log(`⚠️ Unhandled client event: ${eventType}`)
        return NextResponse.json({ success: true, message: "Client event received but no action taken" })
    }
  } catch (error) {
    console.error("💥 Error in handleClientEvents:", error)
    return clientWebhookProcessingErrorResponse(error, "Failed to process client event")
  }
}

async function handleClientCreated(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id

    console.log(`👤 Processing Client.Created for client ${clientId}`)

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    await clientService.createClientFromRemOnline(clientId)

    return NextResponse.json({ success: true, message: "Client created successfully" })
  } catch (error) {
    console.error("💥 Error in handleClientCreated:", error)
    return clientWebhookProcessingErrorResponse(error, "Failed to create client")
  }
}

async function handleClientUpdated(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id

    console.log(`👤 Processing Client.Updated for client ${clientId}`)

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    await clientService.updateClientFromRemOnline(clientId)

    return NextResponse.json({ success: true, message: "Client updated successfully" })
  } catch (error) {
    console.error("💥 Error in handleClientUpdated:", error)
    return clientWebhookProcessingErrorResponse(error, "Failed to update client")
  }
}

async function handleClientDeleted(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id

    console.log(`👤 Processing Client.Deleted for client ${clientId}`)

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    await clientService.deleteClient(clientId)

    return NextResponse.json({ success: true, message: "Client deleted successfully" })
  } catch (error) {
    console.error("💥 Error in handleClientDeleted:", error)
    return clientWebhookProcessingErrorResponse(error, "Failed to delete client")
  }
}
