import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { hash } from "@/lib/auth/utils"
import { z } from "zod"
import remonline from "@/lib/api/remonline"
import { clearUserSessionsByUserId } from "@/app/actions/session"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

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
    console.log("Parsed webhook data:", webhookData)

    // Check the event type
    const eventType = webhookData.event_name || ""

    if (eventType === "Order.Created" || eventType === "Order.Updated") {
      await handleOrderEvent(webhookData)
      return NextResponse.json({ success: true })
    }

    if (eventType === "Client.Created" || eventType === "Client.Updated") {
      const clientId = webhookData.context.object_id
      await handleClientEvent(clientId)
      return NextResponse.json({ success: true })
    }

    // Handle other event types as needed
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

async function handleOrderEvent(webhookData: any) {
  try {
    const orderId = webhookData.context.object_id
    const clientId = webhookData.metadata?.client?.id

    console.log(`Processing order event for order ${orderId}, client ${clientId}`)

    if (!clientId) {
      console.error("No client ID found in webhook metadata")
      return
    }

    const supabase = createClient()

    // Find user by remonline_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("remonline_id", clientId)
      .single()

    if (userError || !user) {
      console.log(`No user found with remonline_id ${clientId}`)
      return
    }

    console.log(`Found user ${user.id} for remonline client ${clientId}`)

    // Get full order details from RemOnline API
    const orderResult = await remonline.getOrderById(orderId)

    if (!orderResult.success || !orderResult.order) {
      console.error("Failed to fetch order details from RemOnline:", orderResult.message)
      return
    }

    const orderData = orderResult.order
    console.log("Full order data:", JSON.stringify(orderData, null, 2))

    // Get order items (services) from RemOnline API
    const itemsResult = await remonline.getOrderItems(orderId)
    let orderItems = []

    if (itemsResult.success && itemsResult.items) {
      orderItems = itemsResult.items
      console.log("Order items:", JSON.stringify(orderItems, null, 2))
    }

    // Calculate total price from items
    const totalPrice = orderItems.reduce((sum: number, item: any) => {
      return sum + Number.parseFloat(item.price || 0) * Number.parseFloat(item.quantity || 1)
    }, 0)

    // Get status information from our database
    const statusInfo = await getStatusByRemOnlineId(orderData.status?.id || 0, "uk", true)

    // Extract order information according to your specification
    const deviceBrand = orderData.asset?.brand || "Unknown"
    const deviceModel = orderData.asset?.model || "Unknown"
    const deviceSerialNumber = orderData.asset?.uid || "N/A"
    const documentId = orderData.id_label || orderData.name || orderId.toString()

    const orderInfo = {
      remonline_order_id: orderId,
      user_id: user.id,
      document_id: documentId,
      creation_date: orderData.created_at || new Date().toISOString(),
      device_serial_number: deviceSerialNumber,
      device_name: `${deviceBrand} ${deviceModel}`.trim(),
      device_brand: deviceBrand,
      device_model: deviceModel,
      total_amount: totalPrice,
      overall_status: orderData.status?.id?.toString() || "unknown",
      overall_status_name: statusInfo.name,
      overall_status_color: statusInfo.color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Processed order info:", orderInfo)

    // Check if order already exists in our database
    const { data: existingOrder } = await supabase
      .from("user_repair_orders")
      .select("id")
      .eq("remonline_order_id", orderId)
      .single()

    let savedOrderId: string

    if (existingOrder) {
      // Update existing order
      const { error: updateError } = await supabase
        .from("user_repair_orders")
        .update({
          document_id: orderInfo.document_id,
          creation_date: orderInfo.creation_date,
          device_serial_number: orderInfo.device_serial_number,
          device_name: orderInfo.device_name,
          device_brand: orderInfo.device_brand,
          device_model: orderInfo.device_model,
          total_amount: orderInfo.total_amount,
          overall_status: orderInfo.overall_status,
          overall_status_name: orderInfo.overall_status_name,
          overall_status_color: orderInfo.overall_status_color,
          updated_at: orderInfo.updated_at,
        })
        .eq("remonline_order_id", orderId)

      if (updateError) {
        console.error("Error updating order:", updateError)
        return
      } else {
        console.log(`Order ${orderId} updated successfully`)
        savedOrderId = existingOrder.id
      }
    } else {
      // Create new order
      const { data: newOrder, error: insertError } = await supabase
        .from("user_repair_orders")
        .insert(orderInfo)
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating order:", insertError)
        return
      } else {
        console.log(`Order ${orderId} created successfully`)
        savedOrderId = newOrder.id
      }
    }

    // Store order services/items
    if (orderItems.length > 0) {
      await storeOrderServices(supabase, savedOrderId, orderId, orderItems)
    }
  } catch (error) {
    console.error("Error in handleOrderEvent:", error)
  }
}

async function storeOrderServices(supabase: any, orderDbId: string, remonlineOrderId: number, items: any[]) {
  try {
    // First, delete existing services for this order
    await supabase.from("user_repair_order_services").delete().eq("order_id", orderDbId)

    // Insert new services
    const servicesToInsert = items.map((item: any) => ({
      order_id: orderDbId,
      remonline_order_id: remonlineOrderId,
      remonline_service_id: item.entity?.id || item.id,
      service_name: item.entity?.title || "Service",
      price: Number.parseFloat(item.price || 0),
      warranty_period: item.warranty?.period || null,
      warranty_units: item.warranty?.period_units || null,
      service_status: "active", // Default status, can be updated later
      service_status_name: "Активна",
      service_status_color: "bg-blue-100 text-blue-800",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("user_repair_order_services").insert(servicesToInsert)

    if (error) {
      console.error("Error storing order services:", error)
    } else {
      console.log(`Stored ${servicesToInsert.length} services for order ${remonlineOrderId}`)
    }
  } catch (error) {
    console.error("Error in storeOrderServices:", error)
  }
}

async function handleClientEvent(clientId: number) {
  try {
    console.log(`Processing client event for client ${clientId}`)

    // Fetch complete client details from RemOnline API
    const clientDetails = await remonline.getClientById(clientId)

    if (!clientDetails.success) {
      console.error("Failed to fetch client details from RemOnline:", clientDetails.message)
      return
    }

    // Check if clientDetails.client exists before parsing
    if (!clientDetails.client) {
      console.error("Client details are undefined, skipping processing")
      return
    }

    const clientData = clientDetails.client
    console.log("Client data:", JSON.stringify(clientData, null, 2))

    if (!clientData.email) {
      console.error("Client from RemOnline has no email, cannot create or update user")
      return
    }

    const supabase = createClient()

    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", clientData.email.toLowerCase())
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking existing user:", selectError)
      return
    }

    if (existingUser) {
      // Update existing user
      await updateExistingUser(supabase, existingUser.id, clientData)
    } else {
      // Create new user
      await createNewUser(supabase, clientData)
    }
  } catch (error) {
    console.error("Error in handleClientEvent:", error)
  }
}

async function createNewUser(supabase: any, clientData: any) {
  try {
    // Extract client data
    const email = clientData.email?.toLowerCase()
    const firstName = clientData.first_name || ""
    const lastName = clientData.last_name || ""
    const phone = clientData.phone || null
    const address = clientData.address || null

    if (!email) {
      console.error("Client from RemOnline has no email, cannot create user")
      return
    }

    // Generate a random password (user will use passwordless login anyway)
    const randomPassword = Math.random().toString(36).slice(-10)
    const passwordHash = await hash(randomPassword)

    // Create user in our database
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: email,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        password_hash: passwordHash,
        role: "user",
        remonline_id: clientData.id,
        email_verified: true, // Since it's coming from RemOnline, we can trust it
      })
      .select("id")
      .single()

    console.log("Supabase insert user data:", {
      email: email,
      name: `${firstName} ${lastName}`.trim(),
      role: "user",
      remonline_id: clientData.id,
      email_verified: true,
    })

    if (userError) {
      console.error("Error creating user from RemOnline webhook:", userError)
      return
    }

    console.log("Supabase insert user result:", newUser)

    // Create profile with email and address
    const profileData = {
      id: newUser.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      email, // Add email to profiles
      address, // Add address to profiles
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("profiles").insert([profileData])

    console.log("Supabase insert profile data:", profileData)

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // If profile creation fails, delete the user to maintain data integrity
      await supabase.from("users").delete().eq("id", newUser.id)
      console.error("Deleted user due to profile creation failure")
      return
    }

    console.log(`User created from RemOnline webhook: ${newUser.id}`)
  } catch (error) {
    console.error("Error in createNewUser:", error)
  }
}

async function updateExistingUser(supabase: any, userId: string, clientData: any) {
  try {
    // Extract client data
    const email = clientData.email?.toLowerCase()
    const firstName = clientData.first_name || ""
    const lastName = clientData.last_name || ""
    const phone = clientData.phone || null
    const address = clientData.address || ""

    if (!email) {
      console.error("Client from RemOnline has no email, cannot update user")
      return
    }

    // Update user
    const { error: userError } = await supabase
      .from("users")
      .update({
        email, // Update email in users
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        remonline_id: clientData.id, // Update remonline_id
      })
      .eq("id", userId)

    console.log("Supabase update user data:", {
      email,
      name: `${firstName} ${lastName}`.trim(),
      remonline_id: clientData.id,
    })

    if (userError) {
      console.error("Error updating user from RemOnline webhook:", userError)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        email, // Update email in profiles
        address, // Update address in profiles
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    console.log("Supabase update profile data:", {
      name: `${firstName} ${lastName}`.trim(),
      phone,
      email,
      address,
    })

    if (profileError) {
      console.error("Error updating profile from RemOnline webhook:", profileError)
    }

    console.log(`User updated from RemOnline webhook: ${userId}`)

    // Clear all user sessions
    await clearUserSessionsByUserId(userId)
  } catch (error) {
    console.error("Error in updateExistingUser:", error)
  }
}
