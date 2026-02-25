import { createServerClient } from "@/utils/supabase/server"
import { createClient } from "@/utils/supabase/client"

export async function getAppSetting(key: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No row found - this might be normal if the setting isn't set yet
        console.log(`App setting for key "${key}" not found in database.`)
      } else {
        console.error(`Error fetching app setting "${key}":`, error)
      }
      return null
    }

    if (!data?.value) {
      console.log(`App setting for key "${key}" has no value.`)
      return null
    }

    return data.value
  } catch (error) {
    console.error(`Unexpected error fetching app setting "${key}":`, error)
    return null
  }
}

export async function isRegistrationEnabled(): Promise<boolean> {
  const setting = await getAppSetting("registration_enabled")
  console.log("Registration enabled check:", setting)
  return setting === "true"
}

export async function updateAppSetting(key: string, value: string): Promise<boolean> {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() })

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
