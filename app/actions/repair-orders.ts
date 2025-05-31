"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { getStatusByRemOnlineId } from "@/lib/order-status-utils"

export async function getUserRepairOrders() {
  try {
    // Get the current user session
    const session = await getSession()
    if (!session || !session.user) {
      return { success: false, message: "Unauthorized" }
    }

    const userId = session.user.id
    const supabase = createServerSupabaseClient()

    // Fetch repair orders for the current user
    const { data: orders, error } = await supabase
      .from("repair_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching repair orders:", error)
      return { success: false, message: "Failed to fetch repair orders" }
    }

    return { success: true, orders }
  } catch (error) {
    console.error("Error in getUserRepairOrders:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

// Додаємо нову функцію для отримання замовлень з перетвореними статусами
export async function getUserRepairOrdersWithStatusNames(locale = "uk") {
  try {
    const result = await getUserRepairOrders()

    if (!result.success || !result.orders) {
      return result
    }

    // Перетворюємо статуси на їх текстові значення
    const ordersWithStatusNames = await Promise.all(
      result.orders.map(async (order) => {
        const statusId = Number.parseInt(order.status, 10)
        if (!isNaN(statusId)) {
          const statusInfo = await getStatusByRemOnlineId(statusId, locale)
          return {
            ...order,
            statusName: statusInfo.name,
            statusColor: statusInfo.color,
          }
        }
        return {
          ...order,
          statusName: order.status,
          statusColor: "text-gray-600",
        }
      }),
    )

    return { success: true, orders: ordersWithStatusNames }
  } catch (error) {
    console.error("Error in getUserRepairOrdersWithStatusNames:", error)
    return { success: false, message: "Помилка завантаження замовлень" }
  }
}
