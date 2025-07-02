import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { OrderService } from "../services/order-service"

export async function handleOrderEvents(webhookData: any) {
  console.log("🔄 handleOrderEvents called with:", webhookData.event_name)

  switch (webhookData.event_name) {
    case "Order.Created":
      await handleOrderCreated(webhookData)
      break
    case "Order.Updated":
      await handleOrderUpdated(webhookData)
      break
    case "Order.Status.Changed":
      console.log("🔄 SPECIAL LOG: Order.Status.Changed event detected")
      await handleOrderStatusChanged(webhookData)
      break
    case "Order.Deleted":
      await handleOrderDeleted(webhookData)
      break
    default:
      console.log("❓ Unknown order event:", webhookData.event_name)
  }
}

async function handleOrderCreated(webhookData: any) {
  console.log("📦 Processing Order.Created")
  // Implementation for order creation
  await OrderService.createOrUpdateOrder(webhookData)
}

async function handleOrderUpdated(webhookData: any) {
  console.log("📝 Processing Order.Updated")
  // Implementation for order updates
  await OrderService.createOrUpdateOrder(webhookData)
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
  console.log("🔄🔄🔄 ENTERING handleOrderStatusChanged")
  console.log("📋 Full webhook data:", JSON.stringify(webhookData, null, 2))

  try {
    const orderId = webhookData.context.object_id
    const newStatusId = webhookData.metadata.new.id
    const oldStatusId = webhookData.metadata.old.id

    console.log("🎯 Order ID:", orderId)
    console.log("📊 Status change:", `${oldStatusId} → ${newStatusId}`)

    // Get user locale for proper translation
    console.log("🔍 Checking if order exists in database...")
    const orderExists = await OrderService.checkOrderExists(orderId)

    if (!orderExists) {
      console.log("❌ Order not found in database:", orderId)
      return
    }

    console.log("✅ Order found, getting user locale...")
    const userLocale = await OrderService.getUserLocaleByOrderId(orderId)
    console.log("🌍 User locale:", userLocale)

    // Update order status
    await OrderService.updateOrderStatus(orderId, newStatusId, userLocale)

    console.log("✅ Order status updated successfully")
  } catch (error) {
    console.error("💥 Error in handleOrderStatusChanged:", error)
  }
}
