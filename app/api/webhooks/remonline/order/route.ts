import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { z } from "zod"
import crypto from "crypto"

// This is the secret key that RemOnline will use to authenticate the webhook
const REMONLINE_ORDER_WEBHOOK_SECRET = process.env.REMONLINE_ORDER_WEBHOOK_SECRET
if (!REMONLINE_ORDER_WEBHOOK_SECRET) {
  console.warn("REMONLINE_ORDER_WEBHOOK_SECRET is not set. Webhook verification will be skipped.")
}

// Define a schema for the RemOnline webhook payload for order creation
const remonlineOrderWebhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  created_at_ts: z.number(),
  event_name: z.string(),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  metadata: z.object({
    order: z.object({
      id: z.number(),
      name: z.string(),
      type: z.number(),
    }),
    client: z.object({
      id: z.number(),
      fullname: z.string(),
    }),
    status: z.object({
      id: z.number(),
    }),
    asset: z
      .object({
        id: z.number(),
        name: z.string(),
      })
      .optional(),
  }),
  "x-signature": z.string().optional(),
  employee: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
  }),
})

// Define a schema for the RemOnline webhook payload for status change
const remonlineStatusChangeWebhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  created_at_ts: z.number(),
  event_name: z.literal("Order.Status.Changed"),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  metadata: z.object({
    new: z.object({
      id: z.number(),
    }),
    old: z.object({
      id: z.number(),
    }),
    order: z.object({
      id: z.number(),
      name: z.string(),
    }),
  }),
  "x-signature": z.string().optional(),
  employee: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Log the request URL to debug routing issues
    console.log(`Webhook received at: ${request.url}`)

    // Log all headers for debugging
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
      console.log(`Header: ${key}: ${value}`)
    })

    // Clone the request to access the body as text
    const clonedRequest = request.clone()
    const requestText = await clonedRequest.text()

    // Log the received webhook
    console.log("RemOnline webhook received")

    // Parse the request body
    let payload
    try {
      payload = JSON.parse(requestText)
      console.log("Webhook payload:", JSON.stringify(payload, null, 2))
    } catch (e) {
      console.error("Failed to parse webhook payload:", e)
      // Return 200 OK even for invalid JSON to prevent webhook deactivation
      return NextResponse.json({ success: false, message: "Invalid JSON" })
    }

    // Verify the webhook signature
    // The signature could be in the header or in the payload itself
    const headerSignature = request.headers.get("x-signature")
    const payloadSignature = payload["x-signature"]
    const signature = headerSignature || payloadSignature

    if (REMONLINE_ORDER_WEBHOOK_SECRET && signature && payload.id) {
      // Based on the example, it seems the signature is in the payload itself
      // and might be using a different method than we initially thought

      const webhookId = payload.id

      // Try different signature verification methods
      let signatureValid = false

      // Method 1: Using webhook ID + secret (as per documentation)
      const computedSignature1 = crypto
        .createHash("sha256")
        .update(`${webhookId}${REMONLINE_ORDER_WEBHOOK_SECRET}`)
        .digest("hex")

      // Method 2: Using request body + secret (common webhook pattern)
      // For this method, we need to remove the x-signature field from the payload
      const payloadWithoutSignature = { ...payload }
      delete payloadWithoutSignature["x-signature"]
      const payloadString = JSON.stringify(payloadWithoutSignature)

      const computedSignature2 = crypto
        .createHmac("sha256", REMONLINE_ORDER_WEBHOOK_SECRET)
        .update(payloadString)
        .digest("hex")

      // Method 3: Using webhook ID + secret with HMAC
      const computedSignature3 = crypto
        .createHmac("sha256", REMONLINE_ORDER_WEBHOOK_SECRET)
        .update(webhookId)
        .digest("hex")

      console.log(`Webhook ID: ${webhookId}`)
      console.log(`Received signature: ${signature}`)
      console.log(`Computed signature 1 (ID+Secret): ${computedSignature1}`)
      console.log(`Computed signature 2 (HMAC body): ${computedSignature2}`)
      console.log(`Computed signature 3 (HMAC ID): ${computedSignature3}`)

      if (signature === computedSignature1) {
        console.log("Webhook signature verified successfully using method 1")
        signatureValid = true
      } else if (signature === computedSignature2) {
        console.log("Webhook signature verified successfully using method 2")
        signatureValid = true
      } else if (signature === computedSignature3) {
        console.log("Webhook signature verified successfully using method 3")
        signatureValid = true
      }

      if (!signatureValid) {
        console.error("Invalid webhook signature - rejecting request")
        return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 })
      }
    } else {
      if (!signature) {
        console.warn("No X-Signature header or payload signature found in the request")
      }
      if (!payload.id) {
        console.warn("No webhook ID found in the payload")
      }
      if (!REMONLINE_ORDER_WEBHOOK_SECRET) {
        console.warn("REMONLINE_ORDER_WEBHOOK_SECRET is not set")
      }
      console.warn("Webhook signature verification skipped")
    }

    // Determine the event type and process accordingly
    const eventName = payload.event_name

    if (eventName === "Order.Status.Changed") {
      // Process status change event
      console.log("Processing order status change event")

      // Validate the webhook payload against the status change schema
      const parsedPayload = remonlineStatusChangeWebhookSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error("Invalid status change webhook payload structure:", parsedPayload.error)
        return NextResponse.json({ success: false, message: "Invalid payload structure for status change" })
      }

      try {
        const result = await processStatusChangeFromWebhook(parsedPayload.data)
        console.log("Status change processing result:", result)

        return NextResponse.json({
          success: true,
          message: "Status change webhook processed successfully",
          result: result,
        })
      } catch (error) {
        console.error(`Error processing status change:`, error)
        return NextResponse.json({
          success: false,
          message: "Error processing status change webhook, but received",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    } else {
      // Process order creation event (original logic)
      console.log("Processing order creation event")

      // Validate the webhook payload against the order creation schema
      const parsedPayload = remonlineOrderWebhookSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error("Invalid order creation webhook payload structure:", parsedPayload.error)
        return NextResponse.json({ success: false, message: "Invalid payload structure for order creation" })
      }

      try {
        const result = await processOrderFromWebhook(parsedPayload.data)
        console.log("Order processing result:", result)

        return NextResponse.json({
          success: true,
          message: "Order creation webhook processed successfully",
          result: result,
        })
      } catch (error) {
        console.error(`Error processing order creation:`, error)
        return NextResponse.json({
          success: false,
          message: "Error processing order creation webhook, but received",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  } catch (error) {
    console.error("Error in webhook handler:", error)
    // Return 200 OK even for errors to prevent webhook deactivation
    return NextResponse.json({
      success: false,
      message: "Error processing webhook, but received",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

// Process status change data from webhook payload
async function processStatusChangeFromWebhook(webhookData: z.infer<typeof remonlineStatusChangeWebhookSchema>) {
  console.log("Creating Supabase client for status change processing...")
  const supabase = createClient()
  console.log("Supabase client created successfully")

  try {
    const orderId = webhookData.context.object_id
    const orderNumber = webhookData.metadata.order.name
    const oldStatusId = webhookData.metadata.old.id
    const newStatusId = webhookData.metadata.new.id
    const updatedAt = webhookData.created_at
    const employeeName = webhookData.employee.full_name

    console.log(`Processing status change for order ID: ${orderId}`)
    console.log(`Order Number: ${orderNumber}, Old Status ID: ${oldStatusId}, New Status ID: ${newStatusId}`)

    // Find the order in our database
    console.log(`Looking for order with remonline_id: ${orderId}`)
    const { data: existingOrder, error: orderError } = await supabase
      .from("repair_orders")
      .select("id, user_id")
      .eq("remonline_id", orderId)
      .single()

    if (orderError) {
      console.error("Error finding order:", orderError)
      return { success: false, message: "Order not found", error: orderError }
    }

    if (!existingOrder) {
      console.log(`No order found with remonline_id: ${orderId}. Skipping status update.`)
      return { success: false, message: "Order not found", code: "ORDER_NOT_FOUND" }
    }

    console.log(`Found order with ID: ${existingOrder.id}`)

    // Update the order status - now storing the numeric status ID instead of text
    console.log(`Updating order status to ID: ${newStatusId}`)
    const { data: updatedOrder, error: updateError } = await supabase
      .from("repair_orders")
      .update({
        status: newStatusId.toString(), // Store as string to maintain compatibility
        updated_at: updatedAt,
      })
      .eq("remonline_id", orderId)
      .select()

    if (updateError) {
      console.error("Error updating order status:", updateError)
      return { success: false, message: "Failed to update order status", error: updateError }
    }

    console.log(`Order status updated successfully: ${orderId}`)

    // Log the status change in the activity log
    console.log(`Logging status change in activities table`)
    const { data: activityLog, error: activityError } = await supabase
      .from("activities")
      .insert([
        {
          entity_type: "repair_order",
          action_type: "status_changed",
          entity_id: existingOrder.id,
          user_id: existingOrder.user_id,
          details: {
            old_status_id: oldStatusId,
            new_status_id: newStatusId,
            changed_by: employeeName,
            order_number: orderNumber,
          },
          created_at: updatedAt,
        },
      ])
      .select()

    if (activityError) {
      console.error("Error logging activity:", activityError)
      // We don't want to fail the whole operation if just the logging fails
      console.log("Continuing despite activity logging error")
    } else {
      console.log(`Activity logged successfully`)
    }

    // Log the status change in the order_status_history table
    console.log(`Logging status change in order_status_history table`)
    const { data: historyLog, error: historyError } = await supabase
      .from("order_status_history")
      .insert([
        {
          order_id: existingOrder.id,
          user_id: existingOrder.user_id,
          old_status: oldStatusId.toString(), // Store as string to maintain compatibility
          new_status: newStatusId.toString(), // Store as string to maintain compatibility
          changed_by: employeeName,
          changed_at: updatedAt,
        },
      ])
      .select()

    if (historyError) {
      console.error("Error logging status history:", historyError)
      // We don't want to fail the whole operation if just the logging fails
      console.log("Continuing despite history logging error")
    } else {
      console.log(`Status history logged successfully`)
    }

    return {
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
      statusChange: {
        from: oldStatusId,
        to: newStatusId,
      },
    }
  } catch (error) {
    console.error("Error processing status change from webhook:", error)
    return {
      success: false,
      message: "Failed to process status change from webhook",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

// Process order data directly from webhook payload
async function processOrderFromWebhook(webhookData: z.infer<typeof remonlineOrderWebhookSchema>) {
  console.log("Creating Supabase client...")
  const supabase = createClient()
  console.log("Supabase client created successfully")

  try {
    const orderId = webhookData.context.object_id
    const clientId = webhookData.metadata.client.id
    const orderNumber = webhookData.metadata.order.name
    const statusId = webhookData.metadata.status.id
    const deviceName = webhookData.metadata.asset?.name || "Unknown Device"
    const createdAt = webhookData.created_at

    console.log(`Processing order from webhook: ${orderId}`)
    console.log(`Webhook Data: ${JSON.stringify(webhookData, null, 2)}`)

    // Find the user by RemOnline client ID
    console.log(`Looking for user with remonline_id: ${clientId}`)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("remonline_id", clientId)
      .single()

    if (userError) {
      console.error("Error finding user by RemOnline ID:", userError)

      if (userError.code === "PGRST116") {
        console.log(`No user found with remonline_id: ${clientId}. Skipping order creation.`)
        return { success: false, message: "User not found", code: "USER_NOT_FOUND" }
      }

      return { success: false, message: "Error finding user", error: userError }
    }

    if (!user) {
      console.log(`No user found with remonline_id: ${clientId}. Skipping order creation.`)
      return { success: false, message: "User not found", code: "USER_NOT_FOUND" }
    }

    console.log(`Found user with ID: ${user.id}`)

    // Extract device brand and model from the device name
    let deviceBrand = "Unknown"
    let deviceModel = deviceName
    console.log(`Device Name: ${deviceName}`)

    // Try to extract brand from device name (e.g., "iphone 11 pro" -> "iPhone" as brand, "11 Pro" as model)
    const knownBrands = ["iphone", "samsung", "xiaomi", "huawei", "oppo", "vivo", "realme", "oneplus", "google"]
    for (const brand of knownBrands) {
      if (deviceName.toLowerCase().includes(brand)) {
        deviceBrand = brand.charAt(0).toUpperCase() + brand.slice(1) // Capitalize brand name
        deviceModel = deviceName.replace(new RegExp(brand, "i"), "").trim()
        break
      }
    }

    // Prepare order details for database - now storing the numeric status ID
    const orderDetails = {
      user_id: user.id,
      remonline_id: orderId,
      reference_number: orderNumber,
      device_brand: deviceBrand,
      device_model: deviceModel,
      service_type: "Діагностика", // Default service type, will be updated with actual data if needed
      status: statusId.toString(), // Store as string to maintain compatibility
      price: null, // Price is not available in the webhook payload
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    }

    console.log(`Order Details: ${JSON.stringify(orderDetails, null, 2)}`)

    // Check if order already exists
    console.log(`Checking if order with remonline_id ${orderId} already exists...`)
    const { data: existingOrder, error: checkError } = await supabase
      .from("repair_orders")
      .select("id")
      .eq("remonline_id", orderId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing order:", checkError)
      return { success: false, message: "Error checking existing order", error: checkError }
    }

    if (existingOrder) {
      console.log(`Order already exists with ID ${existingOrder.id}, updating: ${orderId}`)
      // Update existing order
      console.log("Updating order with details:", orderDetails)
      const { data: updatedOrder, error: updateError } = await supabase
        .from("repair_orders")
        .update(orderDetails)
        .eq("remonline_id", orderId)
        .select()

      if (updateError) {
        console.error("Error updating order:", updateError)
        return { success: false, message: "Failed to update order", error: updateError }
      }

      console.log(`Order updated: ${orderId}`, updatedOrder)
      return { success: true, message: "Order updated", order: updatedOrder }
    } else {
      console.log(`Order does not exist, creating new order: ${orderId}`)
      // Create new order
      console.log("Inserting order with details:", orderDetails)
      const { data: insertedData, error: insertError } = await supabase
        .from("repair_orders")
        .insert([orderDetails])
        .select()

      if (insertError) {
        console.error("Error creating order:", insertError)
        return { success: false, message: "Failed to create order", error: insertError }
      }

      console.log(`Order created: ${orderId}, Inserted Data:`, insertedData)

      // Log the order creation in the activity log
      console.log(`Logging order creation in activities table`)
      const { error: activityError } = await supabase.from("activities").insert([
        {
          entity_type: "repair_order",
          action_type: "created",
          entity_id: insertedData[0].id,
          user_id: user.id,
          details: {
            order_number: orderNumber,
            device: `${deviceBrand} ${deviceModel}`,
            status_id: statusId,
          },
          created_at: createdAt,
        },
      ])

      if (activityError) {
        console.error("Error logging activity:", activityError)
        // We don't want to fail the whole operation if just the logging fails
        console.log("Continuing despite activity logging error")
      } else {
        console.log(`Activity logged successfully`)
      }

      return { success: true, message: "Order created", order: insertedData }
    }
  } catch (error) {
    console.error("Error processing order from webhook:", error)
    return {
      success: false,
      message: "Failed to process order from webhook",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
