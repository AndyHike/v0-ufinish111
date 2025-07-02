import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import remonline from "@/lib/api/remonline"
import { OrderService } from "../services/order-service"

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
    const orderId = webhookData.context.object_id
    const clientId = webhookData.metadata?.client?.id

    console.log(`📦 Processing Order.Created for order ${orderId}, client ${clientId}`)

    if (!clientId) {
      console.error("❌ No client ID found in webhook metadata")
      return NextResponse.json({ success: false, error: "No client ID found" }, { status: 400 })
    }

    const supabase = createClient()

    // Find user by remonline_id
    console.log(`🔍 Looking for user with remonline_id: ${clientId}`)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, remonline_id")
      .eq("remonline_id", clientId)
      .single()

    if (userError || !user) {
      console.log(`❌ No user found with remonline_id ${clientId}`)
      console.log("User search error:", userError)

      // Let's also try to find all users to debug
      const { data: allUsers } = await supabase.from("users").select("id, email, remonline_id").limit(10)

      console.log("📋 Sample users in database:", allUsers)

      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log(`✅ Found user ${user.id} (${user.email}) for remonline client ${clientId}`)

    // Get full order details from RemOnline API
    console.log(`🌐 Fetching order details from RemOnline API for order ${orderId}`)
    const orderResult = await remonline.getOrderById(orderId)

    if (!orderResult.success || !orderResult.order) {
      console.error("❌ Failed to fetch order details from RemOnline:", orderResult.message)
      return NextResponse.json({ success: false, error: "Failed to fetch order details" }, { status: 500 })
    }

    const orderData = orderResult.order
    console.log("📋 Full order data:", JSON.stringify(orderData, null, 2))

    // Get order items (services) from RemOnline API
    console.log(`🛍️ Fetching order items from RemOnline API for order ${orderId}`)
    const itemsResult = await remonline.getOrderItems(orderId)
    let orderItems = []

    if (itemsResult.success && itemsResult.items) {
      orderItems = itemsResult.items
      console.log("📋 Order items:", JSON.stringify(orderItems, null, 2))
    } else {
      console.log("⚠️ No items found or failed to fetch items:", itemsResult.message)
    }

    // Use OrderService to create the order
    console.log(`💾 Creating order in database...`)
    const orderService = new OrderService(supabase)
    const result = await orderService.createOrder(user.id, orderId, orderData, orderItems)

    console.log(`✅ Order created successfully:`, result)
    return NextResponse.json({ success: true, message: "Order created successfully" })
  } catch (error) {
    console.error("💥 Error in handleOrderCreated:", error)
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

    console.log(`📦 Processing Order.Updated for order ${orderId}, client ${clientId}`)

    if (!clientId) {
      console.error("❌ No client ID found in webhook metadata")
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
      console.log(`❌ No user found with remonline_id ${clientId}`)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get full order details from RemOnline API
    const orderResult = await remonline.getOrderById(orderId)

    if (!orderResult.success || !orderResult.order) {
      console.error("❌ Failed to fetch order details from RemOnline:", orderResult.message)
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
    console.error("💥 Error in handleOrderUpdated:", error)
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
      return NextResponse.json({ success: false, error: "No new status ID found" }, { status: 400 })
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
      return NextResponse.json({ success: false, error: "Order not found in database" }, { status: 404 })
    }

    if (!existingOrder) {
      console.error(`❌ Order ${orderId} not found in our database`)
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    console.log(`✅ Found existing order:`, existingOrder)

    // Get user's locale
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("locale")
      .eq("id", existingOrder.user_id)
      .single()

    let userLocale = "uk" // Default to Ukrainian
    if (!userError && user?.locale) {
      userLocale = user.locale
      console.log(`👤 Using user locale: ${userLocale}`)
    } else {
      console.log(`⚠️ Could not get user locale, using default: ${userLocale}`)
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
