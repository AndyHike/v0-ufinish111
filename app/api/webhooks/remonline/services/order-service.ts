import { createClient } from "@/lib/supabase"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

export class OrderService {
  static async createOrUpdateOrder(webhookData: any) {
    // Implementation for creating/updating orders
    console.log("📦 OrderService.createOrUpdateOrder called")
  }

  static async checkOrderExists(remonlineOrderId: number): Promise<boolean> {
    console.log("🔍 Checking if order exists:", remonlineOrderId)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("user_repair_orders")
        .select("id")
        .eq("remonline_order_id", remonlineOrderId.toString())
        .single()

      if (error) {
        console.log("❌ Error checking order existence:", error)
        return false
      }

      console.log("✅ Order exists:", !!data)
      return !!data
    } catch (error) {
      console.error("💥 Error in checkOrderExists:", error)
      return false
    }
  }

  static async getUserLocaleByOrderId(remonlineOrderId: number): Promise<string> {
    console.log("🌍 Getting user locale for order:", remonlineOrderId)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("user_repair_orders")
        .select(`
          user_id,
          users!inner(locale)
        `)
        .eq("remonline_order_id", remonlineOrderId.toString())
        .single()

      if (error || !data) {
        console.log("❌ Error getting user locale, using default 'uk':", error)
        return "uk"
      }

      const locale = data.users?.locale || "uk"
      console.log("✅ User locale found:", locale)
      return locale
    } catch (error) {
      console.error("💥 Error in getUserLocaleByOrderId:", error)
      return "uk"
    }
  }

  static async updateOrderStatus(remonlineOrderId: number, newStatusId: number, userLocale = "uk") {
    console.log("🔄🔄🔄 ENTERING OrderService.updateOrderStatus")
    console.log("📊 Parameters:", { remonlineOrderId, newStatusId, userLocale })

    try {
      // Get status information with proper locale
      console.log("🎯 Getting status info for ID:", newStatusId, "with locale:", userLocale)
      const statusInfo = await getStatusByRemOnlineId(newStatusId, userLocale, true)
      console.log("📋 Status info received:", statusInfo)

      const supabase = createClient()

      // First, get current order data
      console.log("📋 Getting current order data...")
      const { data: currentOrder, error: fetchError } = await supabase
        .from("user_repair_orders")
        .select("*")
        .eq("remonline_order_id", remonlineOrderId.toString())
        .single()

      if (fetchError) {
        console.error("❌ Error fetching current order:", fetchError)
        return
      }

      console.log("📋 Current order data:", currentOrder)

      // Update the order status
      console.log("💾 Executing update query...")
      const { data, error } = await supabase
        .from("user_repair_orders")
        .update({
          overall_status: newStatusId.toString(),
          overall_status_name: statusInfo.name,
          overall_status_color: statusInfo.color,
          updated_at: new Date().toISOString(),
        })
        .eq("remonline_order_id", remonlineOrderId.toString())
        .select()

      if (error) {
        console.error("❌ Error updating order status:", error)
        return
      }

      console.log("✅ Update successful:", data)
      console.log("🎯 Status updated:", `${currentOrder.overall_status_name} → ${statusInfo.name}`)
    } catch (error) {
      console.error("💥 Error in updateOrderStatus:", error)
    }
  }
}
