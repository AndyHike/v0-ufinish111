import { createClient } from "@/lib/supabase"

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).single()

    if (error) {
      console.error(`Error fetching app setting ${key}:`, error)
      return null
    }

    return data?.value || null
  } catch (error) {
    console.error(`Unexpected error fetching app setting ${key}:`, error)
    return null
  }
}

export async function isRegistrationEnabled(): Promise<boolean> {
  const setting = await getAppSetting("registration_enabled")
  return setting === "true"
}

export async function updateAppSetting(key: string, value: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("app_settings").update({ value }).eq("key", key)

    if (error) {
      console.error(`Error updating app setting ${key}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Unexpected error updating app setting ${key}:`, error)
    return false
  }
}
