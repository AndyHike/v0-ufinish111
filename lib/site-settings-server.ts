import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"

const SETTINGS_COOKIE = "site-settings"
const CACHE_DURATION = 5 * 60 * 1000 // 5 хвилин

export async function getSiteSettingsServer() {
  try {
    // Спробуємо отримати з cookies
    const cookieStore = cookies()
    const cachedSettings = cookieStore.get(SETTINGS_COOKIE)

    if (cachedSettings) {
      try {
        const { data, timestamp } = JSON.parse(cachedSettings.value)
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data
        }
      } catch (error) {
        console.error("Error parsing cached settings:", error)
      }
    }

    // Якщо немає кешу або він застарілий, отримуємо з БД
    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("*").single()

    if (error) {
      console.error("Error fetching settings:", error)
      return {
        defaultLanguage: "uk",
        siteLogo: "",
        siteFavicon: "/favicon.ico",
      }
    }

    const settings = {
      defaultLanguage: data.default_language || "uk",
      siteLogo: data.site_logo || "",
      siteFavicon: data.site_favicon || "/favicon.ico",
    }

    // Зберігаємо в cookies для наступних запитів
    cookieStore.set(
      SETTINGS_COOKIE,
      JSON.stringify({
        data: settings,
        timestamp: Date.now(),
      }),
      {
        maxAge: CACHE_DURATION / 1000,
        httpOnly: false, // Щоб клієнт міг читати
        sameSite: "lax",
      },
    )

    return settings
  } catch (error) {
    console.error("Error in getSiteSettingsServer:", error)
    return {
      defaultLanguage: "uk",
      siteLogo: "",
      siteFavicon: "/favicon.ico",
    }
  }
}
