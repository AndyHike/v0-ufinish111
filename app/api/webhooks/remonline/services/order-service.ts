import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

export class OrderService {
  constructor(private supabase: any) {}

  async createOrder(userId: string, remonlineOrderId: number, orderData: any, orderItems: any[]) {
    try {
      // Calculate total price from items
      const totalPrice = orderItems.reduce((sum: number, item: any) => {
        return sum + Number.parseFloat(item.price || 0) * Number.parseFloat(item.quantity || 1)
      }, 0)

      // Get status information from our database
      const statusInfo = await getStatusByRemOnlineId(orderData.status?.id || 0, "uk", true)

      // Extract order information according to specification
      const deviceBrand = orderData.asset?.brand || "Unknown"
      const deviceModel = orderData.asset?.model || "Unknown"
      const deviceSerialNumber = orderData.asset?.uid || "N/A"
      const documentId = orderData.id_label || orderData.name || remonlineOrderId.toString()

      const orderInfo = {
        remonline_order_id: remonlineOrderId,
        user_id: userId,
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

      console.log("Creating order with data:", orderInfo)

      // Create new order
      const { data: newOrder, error: insertError } = await this.supabase
        .from("user_repair_orders")
        .insert(orderInfo)
        .select("id")
        .single()

      if (insertError) {
        console.error("Error creating order:", insertError)
        throw new Error(`Failed to create order: ${insertError.message}`)
      }

      console.log(`Order ${remonlineOrderId} created successfully with ID: ${newOrder.id}`)

      // Store order services/items
      if (orderItems.length > 0) {
        await this.storeOrderServices(newOrder.id, remonlineOrderId, orderItems)
      }

      return newOrder
    } catch (error) {
      console.error("Error in createOrder:", error)
      throw error
    }
  }

  async updateOrder(userId: string, remonlineOrderId: number, orderData: any, orderItems: any[]) {
    try {
      // Calculate total price from items
      const totalPrice = orderItems.reduce((sum: number, item: any) => {
        return sum + Number.parseFloat(item.price || 0) * Number.parseFloat(item.quantity || 1)
      }, 0)

      // Get status information from our database
      const statusInfo = await getStatusByRemOnlineId(orderData.status?.id || 0, "uk", true)

      // Extract order information
      const deviceBrand = orderData.asset?.brand || "Unknown"
      const deviceModel = orderData.asset?.model || "Unknown"
      const deviceSerialNumber = orderData.asset?.uid || "N/A"
      const documentId = orderData.id_label || orderData.name || remonlineOrderId.toString()

      const updateData = {
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
        updated_at: new Date().toISOString(),
      }

      console.log("Updating order with data:", updateData)

      // Check if order exists
      const { data: existingOrder } = await this.supabase
        .from("user_repair_orders")
        .select("id")
        .eq("remonline_order_id", remonlineOrderId)
        .single()

      if (!existingOrder) {
        console.log(`Order ${remonlineOrderId} not found, creating new one`)
        return await this.createOrder(userId, remonlineOrderId, orderData, orderItems)
      }

      // Update existing order
      const { error: updateError } = await this.supabase
        .from("user_repair_orders")
        .update(updateData)
        .eq("remonline_order_id", remonlineOrderId)

      if (updateError) {
        console.error("Error updating order:", updateError)
        throw new Error(`Failed to update order: ${updateError.message}`)
      }

      console.log(`Order ${remonlineOrderId} updated successfully`)

      // Update order services/items
      if (orderItems.length > 0) {
        await this.storeOrderServices(existingOrder.id, remonlineOrderId, orderItems)
      }

      return existingOrder
    } catch (error) {
      console.error("Error in updateOrder:", error)
      throw error
    }
  }

  async deleteOrder(remonlineOrderId: number) {
    try {
      console.log(`Deleting order ${remonlineOrderId}`)

      // First delete order services
      await this.supabase.from("user_repair_order_services").delete().eq("remonline_order_id", remonlineOrderId)

      // Then delete the order
      const { error: deleteError } = await this.supabase
        .from("user_repair_orders")
        .delete()
        .eq("remonline_order_id", remonlineOrderId)

      if (deleteError) {
        console.error("Error deleting order:", deleteError)
        throw new Error(`Failed to delete order: ${deleteError.message}`)
      }

      console.log(`Order ${remonlineOrderId} deleted successfully`)
    } catch (error) {
      console.error("Error in deleteOrder:", error)
      throw error
    }
  }

  private async storeOrderServices(orderDbId: string, remonlineOrderId: number, items: any[]) {
    try {
      // First, delete existing services for this order
      await this.supabase.from("user_repair_order_services").delete().eq("order_id", orderDbId)

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

      const { error } = await this.supabase.from("user_repair_order_services").insert(servicesToInsert)

      if (error) {
        console.error("Error storing order services:", error)
        throw new Error(`Failed to store order services: ${error.message}`)
      }

      console.log(`Stored ${servicesToInsert.length} services for order ${remonlineOrderId}`)
    } catch (error) {
      console.error("Error in storeOrderServices:", error)
      throw error
    }
  }
}
