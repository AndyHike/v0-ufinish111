import { createClient } from "@/lib/supabase"
import { OrderService } from "../services/order-service"

export async function handleOrderEvents(webhookData: any) {
  try {
    console.log("📦 Processing order event:", webhookData.event)

    const eventType = webhookData.event
    const orderId = webhookData.context?.object_id
    const clientId = webhookData.metadata?.client?.id

    if (!orderId) {
      console.error("❌ No order ID in webhook context")
      return { success: false, message: "No order ID provided" }
    }

    console.log(`📦 Order ID: ${orderId}, Client ID: ${clientId}`)

    const orderService = new OrderService(createClient())

    switch (eventType) {
      case "Order.Created":
        return await orderService.handleOrderCreated(orderId, clientId)
      case "Order.Updated":
        return await orderService.handleOrderUpdated(orderId, clientId)
      case "Order.Completed":
        return await orderService.handleOrderCompleted(orderId, clientId)
      case "Order.Cancelled":
        return await orderService.handleOrderCancelled(orderId, clientId)
      default:
        console.log(`⚠️ Unhandled order event: ${eventType}`)
        return { success: true, message: `Order event ${eventType} received but not processed` }
    }
  } catch (error) {
    console.error("💥 Order event processing error:", error)
    return {
      success: false,
      message: "Order event processing failed",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
