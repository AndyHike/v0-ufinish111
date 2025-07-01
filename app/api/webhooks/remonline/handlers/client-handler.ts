import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import remonline from "@/lib/api/remonline"
import { ClientService } from "../services/client-service"

export async function handleClientEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    console.log(`Handling client event: ${eventType}`)

    switch (eventType) {
      case "Client.Created":
        return await handleClientCreated(webhookData)
      case "Client.Updated":
        return await handleClientUpdated(webhookData)
      case "Client.Deleted":
        return await handleClientDeleted(webhookData)
      default:
        console.log(`Unhandled client event: ${eventType}`)
        return NextResponse.json({ success: true, message: "Client event received but no action taken" })
    }
  } catch (error) {
    console.error("Error in handleClientEvents:", error)
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
    console.log(`Processing Client.Created for client ${clientId}`)

    // Fetch complete client details from RemOnline API
    const clientDetails = await remonline.getClientById(clientId)

    if (!clientDetails.success || !clientDetails.client) {
      console.error("Failed to fetch client details from RemOnline:", clientDetails.message)
      return NextResponse.json({ success: false, error: "Failed to fetch client details" }, { status: 500 })
    }

    const clientData = clientDetails.client
    console.log("Client data:", JSON.stringify(clientData, null, 2))

    if (!clientData.email) {
      console.error("Client from RemOnline has no email, cannot create user")
      return NextResponse.json({ success: false, error: "Client has no email" }, { status: 400 })
    }

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    // Create new user from client data
    await clientService.createUserFromClient(clientData)

    return NextResponse.json({ success: true, message: "Client created successfully" })
  } catch (error) {
    console.error("Error in handleClientCreated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create client",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientUpdated(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id
    console.log(`Processing Client.Updated for client ${clientId}`)

    // Fetch complete client details from RemOnline API
    const clientDetails = await remonline.getClientById(clientId)

    if (!clientDetails.success || !clientDetails.client) {
      console.error("Failed to fetch client details from RemOnline:", clientDetails.message)
      return NextResponse.json({ success: false, error: "Failed to fetch client details" }, { status: 500 })
    }

    const clientData = clientDetails.client

    if (!clientData.email) {
      console.error("Client from RemOnline has no email, cannot update user")
      return NextResponse.json({ success: false, error: "Client has no email" }, { status: 400 })
    }

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    // Update existing user from client data
    await clientService.updateUserFromClient(clientData)

    return NextResponse.json({ success: true, message: "Client updated successfully" })
  } catch (error) {
    console.error("Error in handleClientUpdated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update client",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientDeleted(webhookData: any) {
  try {
    const clientId = webhookData.context.object_id
    console.log(`Processing Client.Deleted for client ${clientId}`)

    const supabase = createClient()
    const clientService = new ClientService(supabase)

    // Handle client deletion (maybe just mark as deleted, don't actually delete user)
    await clientService.handleClientDeletion(clientId)

    return NextResponse.json({ success: true, message: "Client deletion handled successfully" })
  } catch (error) {
    console.error("Error in handleClientDeleted:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to handle client deletion",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
