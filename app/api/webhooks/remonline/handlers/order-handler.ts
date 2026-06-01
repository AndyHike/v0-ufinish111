import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { OrderService, RemonlineWebhookOrderError } from "../services/order-service"

const WEBHOOK_ACKNOWLEDGED_ERROR_STATUSES = new Set([400, 404])

function orderWebhookErrorResponse(error: unknown, message: string) {
  const status = error instanceof RemonlineWebhookOrderError ? error.statusCode : 500
  const shouldAcknowledge =
    error instanceof RemonlineWebhookOrderError && WEBHOOK_ACKNOWLEDGED_ERROR_STATUSES.has(status)

  return NextResponse.json(
    {
      success: false,
      ignored: shouldAcknowledge,
      error: message,
      details: error instanceof Error ? error.message : String(error),
    },
    { status: shouldAcknowledge ? 200 : status },
  )
}

export async function handleOrderEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    console.log(`📦 Handling order event: ${eventType}`)

    switch (eventType) {
      case "Order.Created":
        return await handleOrderCreated(webhookData)
      case "Order.Updated":
        return await handleOrderUpdated(webhookData)
      case "Order.Deleted":
        return await handleOrderDeleted(webhookData)
      case "Order.Status.Changed":
        return await handleOrderStatusChanged(webhookData)
      default:
        console.log(`⚠️ Unhandled order event: ${eventType}`)
        return NextResponse.json({ success: true, message: "Order event received but no action taken" })
    }
  } catch (error) {
    console.error("💥 Error in handleOrderEvents:", error)
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

async function handleOrderCreated(webhookData: any) {
  try {
    const supabase = createClient()
    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromWebhookPayload(webhookData)

    return NextResponse.json({ success: true, message: "Order synced from webhook payload", order })
  } catch (error) {
    return orderWebhookErrorResponse(error, "Failed to create order from webhook payload")
  }
}

async function handleOrderUpdated(webhookData: any) {
  try {
    const supabase = createClient()
    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromWebhookPayload(webhookData)

    return NextResponse.json({ success: true, message: "Order updated from webhook payload", order })
  } catch (error) {
    return orderWebhookErrorResponse(error, "Failed to update order from webhook payload")
  }
}

async function handleOrderDeleted(webhookData: any) {
  try {
    const orderId = webhookData.context.object_id

    console.log(`📦 Processing Order.Deleted for order ${orderId}`)

    const supabase = createClient()

    // Use OrderService to delete the order
    const orderService = new OrderService(supabase)
    await orderService.deleteOrder(orderId)

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("💥 Error in handleOrderDeleted:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleOrderStatusChanged(webhookData: any) {
  try {
    console.log("🔄🔄🔄 ENTERING handleOrderStatusChanged 🔄🔄🔄")

    const orderId = webhookData.context.object_id
    const newStatusId = webhookData.metadata?.new?.id
    const oldStatusId = webhookData.metadata?.old?.id

    console.log(`🔄 Processing Order.Status.Changed for order ${orderId}`)
    console.log(`📊 Status change: ${oldStatusId} → ${newStatusId}`)
    console.log(`📋 Full webhook data:`, JSON.stringify(webhookData, null, 2))

    if (!newStatusId) {
      console.error("❌ No new status ID found in webhook metadata")
      console.error("❌ Expected path: metadata.new.id")
      console.error("❌ Received metadata:", JSON.stringify(webhookData.metadata, null, 2))
      return NextResponse.json(
        { success: false, ignored: true, error: "No new status ID found" },
        { status: 200 },
      )
    }

    const supabase = createClient()
    console.log("✅ Supabase client created")

    // First, let's check if the order exists in our database
    console.log(`🔍 Checking if order ${orderId} exists in database...`)
    const { data: existingOrder, error: orderCheckError } = await supabase
      .from("user_repair_orders")
      .select("id, user_id, document_id, overall_status")
      .eq("remonline_order_id", orderId)
      .single()

    if (orderCheckError) {
      console.error("❌ Error checking for existing order:", orderCheckError)
      console.error("❌ This might mean the order doesn't exist in our database yet")
      if (orderCheckError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, ignored: true, error: "Order not found in database", orderId },
          { status: 200 },
        )
      }

      return NextResponse.json({ success: false, error: "Failed to check order in database" }, { status: 500 })
    }

    if (!existingOrder) {
      console.error(`❌ Order ${orderId} not found in our database`)
      return NextResponse.json(
        { success: false, ignored: true, error: "Order not found in database", orderId },
        { status: 200 },
      )
    }

    console.log(`✅ Found existing order:`, existingOrder)

    // Get user's locale from users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("locale")
      .eq("id", existingOrder.user_id)
      .single()

    let userLocale = "uk" // Default to Ukrainian
    if (!userError && user?.locale) {
      userLocale = user.locale
      console.log(`👤 Using user locale from database: ${userLocale}`)
    } else {
      console.log(`⚠️ Could not get user locale from database, using default: ${userLocale}`)
      if (userError) {
        console.log("User error:", userError)
      }
    }

    // Use OrderService to update the order status
    console.log(`🔄 Calling OrderService.updateOrderStatus...`)
    const orderService = new OrderService(supabase)
    const result = await orderService.updateOrderStatus(orderId, newStatusId, userLocale)

    console.log(`✅ Order ${orderId} status updated from ${oldStatusId} to ${newStatusId}`)
    console.log(`✅ Update result:`, result)

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      orderId: orderId,
      oldStatus: oldStatusId,
      newStatus: newStatusId,
      result: result,
    })
  } catch (error) {
    console.error("💥💥💥 Error in handleOrderStatusChanged:", error)
    console.error("💥 Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
