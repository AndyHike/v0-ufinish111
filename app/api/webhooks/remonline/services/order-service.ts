import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

export class OrderService {
  constructor(private supabase: any) {}

  async createOrder(userId: string, remonlineOrderId: number, orderData: any, orderItems: any[]) {
    try {
      console.log(`💾 OrderService.createOrder called with:`)
      console.log(`   - userId: ${userId}`)
      console.log(`   - remonlineOrderId: ${remonlineOrderId}`)
      console.log(`   - orderData keys: ${Object.keys(orderData)}`)
      console.log(`   - orderItems count: ${orderItems.length}`)

      // Calculate total price from items
      const totalPrice = orderItems.reduce((sum: number, item: any) => {
        const itemPrice = Number.parseFloat(item.price || 0)
        const itemQuantity = Number.parseFloat(item.quantity || 1)
        console.log(`   - Item: ${item.entity?.title || "Unknown"}, Price: ${itemPrice}, Qty: ${itemQuantity}`)
        return sum + itemPrice * itemQuantity
      }, 0)

      console.log(`💰 Calculated total price: ${totalPrice}`)

      // Get status information from our database
      const statusId = orderData.status?.id || 0
      console.log(`📊 Getting status info for status ID: ${statusId}`)
      const statusInfo = await getStatusByRemOnlineId(statusId, "uk", true)
      console.log(`📊 Status info:`, statusInfo)

      // Extract order information according to specification
      const deviceBrand = orderData.asset?.brand || "Unknown"
      const deviceModel = orderData.asset?.model || "Unknown"
      const deviceSerialNumber = orderData.asset?.uid || "N/A"
      const documentId = orderData.id_label || orderData.name || remonlineOrderId.toString()

      console.log(`📱 Device info:`)
      console.log(`   - Brand: ${deviceBrand}`)
      console.log(`   - Model: ${deviceModel}`)
      console.log(`   - Serial: ${deviceSerialNumber}`)
      console.log(`   - Document ID: ${documentId}`)

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
        overall_status: statusId.toString(),
        overall_status_name: statusInfo.name,
        overall_status_color: statusInfo.color,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("💾 Creating order with data:", JSON.stringify(orderInfo, null, 2))

      // Check if order already exists
      const { data: existingOrder } = await this.supabase
        .from("user_repair_orders")
        .select("id")
        .eq("remonline_order_id", remonlineOrderId)
        .single()

      if (existingOrder) {
        console.log(`⚠️ Order ${remonlineOrderId} already exists, updating instead`)
        return await this.updateOrder(userId, remonlineOrderId, orderData, orderItems)
      }

      // Create new order
      const { data: newOrder, error: insertError } = await this.supabase
        .from("user_repair_orders")
        .insert(orderInfo)
        .select("id")
        .single()

      if (insertError) {
        console.error("❌ Error creating order:", insertError)
        throw new Error(`Failed to create order: ${insertError.message}`)
      }

      console.log(`✅ Order ${remonlineOrderId} created successfully with ID: ${newOrder.id}`)

      // Store order services/items
      if (orderItems.length > 0) {
        await this.storeOrderServices(newOrder.id, remonlineOrderId, orderItems)
      }

      return newOrder
    } catch (error) {
      console.error("💥 Error in createOrder:", error)
      throw error
    }
  }

  async updateOrder(userId: string, remonlineOrderId: number, orderData: any, orderItems: any[]) {
    try {
      console.log(`🔄 OrderService.updateOrder called for order ${remonlineOrderId}`)

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

      console.log("🔄 Updating order with data:", updateData)

      // Check if order exists
      const { data: existingOrder } = await this.supabase
        .from("user_repair_orders")
        .select("id")
        .eq("remonline_order_id", remonlineOrderId)
        .single()

      if (!existingOrder) {
        console.log(`⚠️ Order ${remonlineOrderId} not found, creating new one`)
        return await this.createOrder(userId, remonlineOrderId, orderData, orderItems)
      }

      // Update existing order
      const { error: updateError } = await this.supabase
        .from("user_repair_orders")
        .update(updateData)
        .eq("remonline_order_id", remonlineOrderId)

      if (updateError) {
        console.error("❌ Error updating order:", updateError)
        throw new Error(`Failed to update order: ${updateError.message}`)
      }

      console.log(`✅ Order ${remonlineOrderId} updated successfully`)

      // Update order services/items
      if (orderItems.length > 0) {
        await this.storeOrderServices(existingOrder.id, remonlineOrderId, orderItems)
      }

      return existingOrder
    } catch (error) {
      console.error("💥 Error in updateOrder:", error)
      throw error
    }
  }

  async updateOrderStatus(remonlineOrderId: number, newStatusId: number, userLocale = "uk") {
    try {
      console.log("🔄🔄🔄 ENTERING OrderService.updateOrderStatus 🔄🔄🔄")
      console.log(`📊 Parameters:`)
      console.log(`   - remonlineOrderId: ${remonlineOrderId}`)
      console.log(`   - newStatusId: ${newStatusId}`)
      console.log(`   - userLocale: ${userLocale}`)

      // Get status information from our database with user's locale
      console.log(`🔍 Getting status info from database...`)
      const statusInfo = await getStatusByRemOnlineId(newStatusId, userLocale, true)
      console.log(`📊 Status info for ID ${newStatusId} (${userLocale}):`, statusInfo)

      const updateData = {
        overall_status: newStatusId.toString(),
        overall_status_name: statusInfo.name,
        overall_status_color: statusInfo.color,
        updated_at: new Date().toISOString(),
      }

      console.log("🔄 Preparing to update order with data:", updateData)

      // First, let's check what's currently in the database
      const { data: currentOrder, error: selectError } = await this.supabase
        .from("user_repair_orders")
        .select("id, document_id, overall_status, overall_status_name, overall_status_color")
        .eq("remonline_order_id", remonlineOrderId)
        .single()

      if (selectError) {
        console.error("❌ Error selecting current order:", selectError)
        throw new Error(`Failed to find order: ${selectError.message}`)
      }

      console.log("📋 Current order data:", currentOrder)

      // Update existing order
      console.log(`💾 Executing update query...`)
      const { data: updatedOrder, error: updateError } = await this.supabase
        .from("user_repair_orders")
        .update(updateData)
        .eq("remonline_order_id", remonlineOrderId)
        .select("id, document_id, overall_status, overall_status_name, overall_status_color")

      if (updateError) {
        console.error("❌ Error updating order status:", updateError)
        console.error("❌ Update data was:", updateData)
        console.error("❌ RemOnline Order ID:", remonlineOrderId)
        throw new Error(`Failed to update order status: ${updateError.message}`)
      }

      if (!updatedOrder || updatedOrder.length === 0) {
        console.warn(`⚠️ No order found with remonline_order_id ${remonlineOrderId}`)
        throw new Error(`Order ${remonlineOrderId} not found`)
      }

      console.log("✅ Update successful! Updated order data:", updatedOrder[0])
      console.log(`✅ Order ${remonlineOrderId} (${updatedOrder[0].document_id}) status updated successfully`)
      console.log(`✅ Status: ${currentOrder.overall_status} → ${updatedOrder[0].overall_status}`)
      console.log(`✅ Status name: ${currentOrder.overall_status_name} → ${updatedOrder[0].overall_status_name}`)

      return updatedOrder[0]
    } catch (error) {
      console.error("💥💥💥 Error in updateOrderStatus:", error)
      console.error("💥 Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
      })
      throw error
    }
  }

  async deleteOrder(remonlineOrderId: number) {
    try {
      console.log(`🗑️ Deleting order ${remonlineOrderId}`)

      // First delete order services
      await this.supabase.from("user_repair_order_services").delete().eq("remonline_order_id", remonlineOrderId)

      // Then delete the order
      const { error: deleteError } = await this.supabase
        .from("user_repair_orders")
        .delete()
        .eq("remonline_order_id", remonlineOrderId)

      if (deleteError) {
        console.error("❌ Error deleting order:", deleteError)
        throw new Error(`Failed to delete order: ${deleteError.message}`)
      }

      console.log(`✅ Order ${remonlineOrderId} deleted successfully`)
    } catch (error) {
      console.error("💥 Error in deleteOrder:", error)
      throw error
    }
  }

  private async storeOrderServices(orderDbId: string, remonlineOrderId: number, items: any[]) {
    try {
      console.log(`🛍️ Storing ${items.length} services for order ${remonlineOrderId}`)

      // First, delete existing services for this order
      await this.supabase.from("user_repair_order_services").delete().eq("order_id", orderDbId)

      // Insert new services
      const servicesToInsert = items.map((item: any) => {
        const service = {
          order_id: orderDbId,
          remonline_order_id: remonlineOrderId,
          remonline_service_id: item.entity?.id || item.id,
          service_name: item.entity?.title || "Service",
          price: Number.parseFloat(item.price || 0),
          warranty_period: item.warranty?.period || null,
          warranty_units: item.warranty?.period_units || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log(`   - Service: ${service.service_name}, Price: ${service.price}`)
        return service
      })

      const { error } = await this.supabase.from("user_repair_order_services").insert(servicesToInsert)

      if (error) {
        console.error("❌ Error storing order services:", error)
        throw new Error(`Failed to store order services: ${error.message}`)
      }

      console.log(`✅ Stored ${servicesToInsert.length} services for order ${remonlineOrderId}`)
    } catch (error) {
      console.error("💥 Error in storeOrderServices:", error)
      throw error
    }
  }
}
