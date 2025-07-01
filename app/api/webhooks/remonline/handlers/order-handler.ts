import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import remonline from "@/lib/api/remonline"
import { OrderService } from "../services/order-service"

export async function handleOrderEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    console.log(`Handling order event: ${eventType}`)

    switch (eventType) {
      case "Order.Created":
        return await handleOrderCreated(webhookData)
      case "Order.Updated":
        return await handleOrderUpdated(webhookData)
      case "Order.Deleted":
        return await handleOrderDeleted(webhookData)
      default:
        console.log(`Unhandled order event: ${eventType}`)
        return NextResponse.json({ success: true, message: "Order event received but no action taken" })
    }
  } catch (error) {
    console.error("Error in handleOrderEvents:", error)
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
    const orderId = webhookData.context.object_id
    const clientId = webhookData.metadata?.client?.id

    console.log(`Processing Order.Created for order ${orderId}, client ${clientId}`)

    if (!clientId) {
      console.error("No client ID found in webhook metadata")
      return NextResponse.json({ success: false, error: "No client ID found" }, { status: 400 })
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
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log(`Found user ${user.id} for remonline client ${clientId}`)

    // Get full order details from RemOnline API
    const orderResult = await remonline.getOrderById(orderId)

    if (!orderResult.success || !orderResult.order) {
      console.error("Failed to fetch order details from RemOnline:", orderResult.message)
      return NextResponse.json({ success: false, error: "Failed to fetch order details" }, { status: 500 })
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

    // Use OrderService to create the order
    const orderService = new OrderService(supabase)
    await orderService.createOrder(user.id, orderId, orderData, orderItems)

    return NextResponse.json({ success: true, message: "Order created successfully" })
  } catch (error) {
    console.error("Error in handleOrderCreated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleOrderUpdated(webhookData: any) {
  try {
    const orderId = webhookData.context.object_id
    const clientId = webhookData.metadata?.client?.id

    console.log(`Processing Order.Updated for order ${orderId}, client ${clientId}`)

    if (!clientId) {
      console.error("No client ID found in webhook metadata")
      return NextResponse.json({ success: false, error: "No client ID found" }, { status: 400 })
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
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get full order details from RemOnline API
    const orderResult = await remonline.getOrderById(orderId)

    if (!orderResult.success || !orderResult.order) {
      console.error("Failed to fetch order details from RemOnline:", orderResult.message)
      return NextResponse.json({ success: false, error: "Failed to fetch order details" }, { status: 500 })
    }

    const orderData = orderResult.order

    // Get order items (services) from RemOnline API
    const itemsResult = await remonline.getOrderItems(orderId)
    let orderItems = []

    if (itemsResult.success && itemsResult.items) {
      orderItems = itemsResult.items
    }

    // Use OrderService to update the order
    const orderService = new OrderService(supabase)
    await orderService.updateOrder(user.id, orderId, orderData, orderItems)

    return NextResponse.json({ success: true, message: "Order updated successfully" })
  } catch (error) {
    console.error("Error in handleOrderUpdated:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleOrderDeleted(webhookData: any) {
  try {
    const orderId = webhookData.context.object_id

    console.log(`Processing Order.Deleted for order ${orderId}`)

    const supabase = createClient()

    // Use OrderService to delete the order
    const orderService = new OrderService(supabase)
    await orderService.deleteOrder(orderId)

    return NextResponse.json({ success: true, message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error in handleOrderDeleted:", error)
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
