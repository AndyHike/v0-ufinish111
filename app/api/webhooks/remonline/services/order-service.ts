import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase/server"
import type {
  OrderData as RemonlineOrderData,
  ServiceData as RemonlineServiceData,
} from "@/app/api/webhooks/remonline/services/order-service"

export interface OrderData {
  id: number
  document_id: string
  creation_date: string
  device_serial_number: string
  device_name: string
  device_brand?: string
  device_model?: string
  total_amount: number
  overall_status: string
  overall_status_name: string
  overall_status_color: string
  user_id?: string
}

export interface ServiceData {
  id: string
  service_name: string
  price: number
  warranty_period?: number
  warranty_units?: string
  service_status: string
  service_status_name: string
  service_status_color: string
  order_id: number
}

export class OrderService {
  private supabase = createClient()

  async handleOrderCreated(orderId: number, clientId?: number) {
    console.log(`📦 Creating order ${orderId} for client ${clientId}`)
    return await this.processOrder(orderId, clientId, "created")
  }

  async handleOrderUpdated(orderId: number, clientId?: number) {
    console.log(`📦 Updating order ${orderId} for client ${clientId}`)
    return await this.processOrder(orderId, clientId, "updated")
  }

  async handleOrderCompleted(orderId: number, clientId?: number) {
    console.log(`📦 Completing order ${orderId} for client ${clientId}`)
    return await this.processOrder(orderId, clientId, "completed")
  }

  async handleOrderCancelled(orderId: number, clientId?: number) {
    console.log(`📦 Cancelling order ${orderId} for client ${clientId}`)
    return await this.processOrder(orderId, clientId, "cancelled")
  }

  private async processOrder(orderId: number, clientId?: number, action = "processed") {
    try {
      // Step 1: Find user by remonline_id
      if (!clientId) {
        console.error("❌ No client ID provided")
        return { success: false, message: "No client ID provided" }
      }

      console.log(`🔍 Looking for user with remonline_id: ${clientId}`)
      const { data: user, error: userError } = await this.supabase
        .from("users")
        .select("id, email, remonline_id")
        .eq("remonline_id", clientId.toString())
        .single()

      if (userError || !user) {
        console.error(`❌ User not found for remonline_id ${clientId}:`, userError)
        return { success: false, message: `User not found for remonline_id ${clientId}` }
      }

      console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)

      // Step 2: Get order details from RemOnline
      console.log(`📡 Fetching order ${orderId} from RemOnline...`)
      const orderResult = await remonline.getOrderById(orderId)

      if (!orderResult.success || !orderResult.order) {
        console.error(`❌ Failed to fetch order ${orderId}:`, orderResult.message)
        return { success: false, message: `Failed to fetch order: ${orderResult.message}` }
      }

      const order = orderResult.order
      console.log(`✅ Order fetched:`, {
        id: order.id,
        status: order.status,
        total: order.total,
        device: order.device_name,
      })

      // Step 3: Get order items/services
      console.log(`📡 Fetching order items for order ${orderId}...`)
      const itemsResult = await remonline.getOrderItems(orderId)

      if (!itemsResult.success) {
        console.error(`❌ Failed to fetch order items:`, itemsResult.message)
        return { success: false, message: `Failed to fetch order items: ${itemsResult.message}` }
      }

      const services = itemsResult.items || []
      console.log(`✅ Found ${services.length} services for order`)

      // Step 4: Check if order already exists
      const { data: existingOrder } = await this.supabase
        .from("user_repair_orders")
        .select("id")
        .eq("remonline_order_id", orderId.toString())
        .eq("user_id", user.id)
        .single()

      let userOrderId: string

      if (existingOrder) {
        console.log(`📝 Updating existing order ${existingOrder.id}`)
        // Update existing order
        const { data: updatedOrder, error: updateError } = await this.supabase
          .from("user_repair_orders")
          .update({
            status: order.status || "unknown",
            total_amount: order.total || 0,
            device_name: order.device_name || "",
            device_serial: order.device_serial || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id)
          .select("id")
          .single()

        if (updateError) {
          console.error(`❌ Failed to update order:`, updateError)
          return { success: false, message: `Failed to update order: ${updateError.message}` }
        }

        userOrderId = existingOrder.id
      } else {
        console.log(`📝 Creating new order for user ${user.id}`)
        // Create new order
        const { data: newOrder, error: insertError } = await this.supabase
          .from("user_repair_orders")
          .insert([
            {
              user_id: user.id,
              remonline_order_id: orderId.toString(),
              status: order.status || "unknown",
              total_amount: order.total || 0,
              device_name: order.device_name || "",
              device_serial: order.device_serial || "",
              created_at: order.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select("id")
          .single()

        if (insertError) {
          console.error(`❌ Failed to create order:`, insertError)
          return { success: false, message: `Failed to create order: ${insertError.message}` }
        }

        userOrderId = newOrder.id
      }

      // Step 5: Update services
      if (services.length > 0) {
        console.log(`📝 Processing ${services.length} services...`)

        // Delete existing services
        await this.supabase.from("user_repair_order_services").delete().eq("order_id", userOrderId)

        // Insert new services
        const servicesToInsert = services.map((service: any) => ({
          order_id: userOrderId,
          service_name: service.name || "Unknown Service",
          price: service.price || 0,
          warranty_period: service.warranty_period || 0,
          warranty_units: service.warranty_units || "",
          status: service.status || "pending",
        }))

        const { error: servicesError } = await this.supabase.from("user_repair_order_services").insert(servicesToInsert)

        if (servicesError) {
          console.error(`❌ Failed to insert services:`, servicesError)
          return { success: false, message: `Failed to insert services: ${servicesError.message}` }
        }

        console.log(`✅ Inserted ${servicesToInsert.length} services`)
      }

      console.log(`🎉 Order ${orderId} ${action} successfully for user ${user.email}`)
      return {
        success: true,
        message: `Order ${orderId} ${action} successfully`,
        data: {
          orderId: userOrderId,
          remonlineOrderId: orderId,
          userId: user.id,
          servicesCount: services.length,
        },
      }
    } catch (error) {
      console.error(`💥 Error processing order ${orderId}:`, error)
      return {
        success: false,
        message: "Order processing failed",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

export async function saveOrderToDatabase(orderData: RemonlineOrderData, services: RemonlineServiceData[] = []) {
  try {
    const supabase = createClient()

    // Insert or update the order
    const { data: order, error: orderError } = await supabase
      .from("user_repair_orders")
      .upsert([orderData], { onConflict: "remonline_order_id" })
      .select()
      .single()

    if (orderError) {
      console.error("Error saving order:", orderError)
      throw orderError
    }

    // Insert or update services
    if (services.length > 0) {
      const servicesWithOrderId = services.map((service) => ({
        ...service,
        order_id: order.id,
      }))

      const { error: servicesError } = await supabase
        .from("user_repair_order_services")
        .upsert(servicesWithOrderId, { onConflict: "remonline_service_id" })

      if (servicesError) {
        console.error("Error saving services:", servicesError)
        throw servicesError
      }
    }

    console.log(`✅ Order ${orderData.document_id} saved successfully`)
    return { success: true, order }
  } catch (error) {
    console.error("💥 Error saving order to database:", error)
    throw error
  }
}

export async function getOrderFromDatabase(orderId: number) {
  try {
    const supabase = createClient()

    const { data: order, error } = await supabase
      .from("user_repair_orders")
      .select(`
        *,
        services:user_repair_order_services(*)
      `)
      .eq("remonline_order_id", orderId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching order:", error)
      throw error
    }

    return order
  } catch (error) {
    console.error("💥 Error fetching order from database:", error)
    throw error
  }
}
