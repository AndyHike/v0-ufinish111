import { ClientService } from "../services/client-service"

export async function handleClientEvents(webhookData: any) {
  try {
    console.log("👤 Processing client event:", webhookData.event)

    const eventType = webhookData.event
    const clientId = webhookData.context?.object_id

    if (!clientId) {
      console.error("❌ No client ID in webhook context")
      return { success: false, message: "No client ID provided" }
    }

    console.log(`👤 Client ID: ${clientId}`)

    const clientService = new ClientService()

    switch (eventType) {
      case "Client.Created":
        return await clientService.handleClientCreated(clientId)
      case "Client.Updated":
        return await clientService.handleClientUpdated(clientId)
      case "Client.Deleted":
        return await clientService.handleClientDeleted(clientId)
      default:
        console.log(`⚠️ Unhandled client event: ${eventType}`)
        return { success: true, message: `Client event ${eventType} received but not processed` }
    }
  } catch (error) {
    console.error("💥 Client event processing error:", error)
    return {
      success: false,
      message: "Client event processing failed",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
