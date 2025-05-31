import { createClient } from "@/lib/supabase"

export type OrderStatus = {
  id: number
  remonline_status_id: number
  name_uk: string
  name_en: string
  name_cs: string
  color: string
  created_at?: string
  updated_at?: string
}

// Cache for order statuses
let statusesCache: OrderStatus[] | null = null
let lastFetchTime = 0
const CACHE_TTL = 30 * 1000 // Зменшуємо до 30 секунд для тестування

export async function getOrderStatuses(forceRefresh = false): Promise<OrderStatus[]> {
  const now = Date.now()

  // Use cache if it exists and hasn't expired, and we're not forcing a refresh
  if (statusesCache && now - lastFetchTime < CACHE_TTL && !forceRefresh) {
    return statusesCache
  }

  console.log("Fetching fresh statuses from database")
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("order_statuses")
      .select("*")
      .order("remonline_status_id", { ascending: true })

    if (error) throw error

    // Update cache
    statusesCache = data
    lastFetchTime = now

    return data
  } catch (error) {
    console.error("Error fetching order statuses:", error)
    // Return cache if it exists, even if it's expired
    return statusesCache || []
  }
}

// Змінюємо функцію getStatusByRemOnlineId, щоб вона примусово оновлювала дані
export async function getStatusByRemOnlineId(
  remonlineStatusId: number,
  locale = "uk",
  forceRefresh = false,
): Promise<{ name: string; color: string }> {
  try {
    const statuses = await getOrderStatuses(forceRefresh)
    const status = statuses.find((s) => s.remonline_status_id === remonlineStatusId)

    if (!status) {
      console.warn(`Status with ID ${remonlineStatusId} not found`)
      return { name: `Статус ${remonlineStatusId}`, color: "bg-gray-100" }
    }

    // Вибираємо назву статусу відповідно до локалі
    let name = status.name_uk
    if (locale === "en") name = status.name_en || status.name_uk
    if (locale === "cs") name = status.name_cs || status.name_uk

    // Повертаємо оригінальний колір без перетворення
    return { name, color: status.color }
  } catch (error) {
    console.error("Error getting status by RemOnline ID:", error)
    return { name: `Статус ${remonlineStatusId}`, color: "bg-gray-100" }
  }
}

export function clearStatusCache() {
  console.log("Clearing order status cache")
  statusesCache = null
  lastFetchTime = 0
  console.log("Status cache cleared", { statusesCache, lastFetchTime })
}

// Оновлюємо функцію getStatusColor для кращого дизайну
export function getStatusColor(statusId: number): string {
  // Improved status colors with better contrast and design
  switch (statusId) {
    case 1: // New
      return "bg-blue-100 text-blue-800 border border-blue-200"
    case 2: // In Progress
      return "bg-amber-100 text-amber-800 border border-amber-200"
    case 3: // Waiting for Parts
      return "bg-purple-100 text-purple-800 border border-purple-200"
    case 4: // Waiting for Client
      return "bg-indigo-100 text-indigo-800 border border-indigo-200"
    case 5: // Completed
      return "bg-green-100 text-green-800 border border-green-200"
    case 6: // Cancelled
      return "bg-red-100 text-red-800 border border-red-200"
    case 7: // On Hold
      return "bg-gray-100 text-gray-800 border border-gray-200"
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200"
  }
}
