import { NextResponse } from "next/server"

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

async function handleClientCreated(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id
    console.log(`👤 Processing Client.Created for client ${clientId}`)

    // For now, just log the event
    console.log("Client created webhook received, no action needed")

    return NextResponse.json({ success: true, message: "Client created event processed" })
  } catch (error) {
    console.error("💥 Error in handleClientCreated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process client created event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientUpdated(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id
    console.log(`👤 Processing Client.Updated for client ${clientId}`)

    // For now, just log the event
    console.log("Client updated webhook received, no action needed")

    return NextResponse.json({ success: true, message: "Client updated event processed" })
  } catch (error) {
    console.error("💥 Error in handleClientUpdated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process client updated event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientDeleted(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id
    console.log(`👤 Processing Client.Deleted for client ${clientId}`)

    // For now, just log the event
    console.log("Client deleted webhook received, no action needed")

    return NextResponse.json({ success: true, message: "Client deleted event processed" })
  } catch (error) {
    console.error("💥 Error in handleClientDeleted:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process client deleted event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
