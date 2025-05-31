import { createClient } from "@/lib/supabase"

// Cache for app settings to reduce database calls
const settingsCache: Record<string, string> = {}
let lastFetchTime = 0
const CACHE_TTL = 60000 // 1 minute cache

/**
 * Get an app setting value by key
 */
export async function getAppSetting(key: string): Promise<string | null> {
  // Check cache first if it's not expired
  const now = Date.now()
  if (now - lastFetchTime < CACHE_TTL && key in settingsCache) {
    return settingsCache[key]
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).single()

    if (error || !data) {
      console.error(`Error fetching app setting ${key}:`, error)
      return null
    }

    // Update cache
    settingsCache[key] = data.value
    lastFetchTime = now

    return data.value
  } catch (error) {
    console.error(`Unexpected error fetching app setting ${key}:`, error)
    return null
  }
}

/**
 * Check if registration is enabled
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  const value = await getAppSetting("registration_enabled")
  return value === "true"
}
