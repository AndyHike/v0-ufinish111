import { createClient } from "@/lib/supabase/client"

export interface ServerSiteSettings {
  defaultLanguage: string
  siteLogo: string
  siteFavicon: string
}

/**
 * Серверна функція для отримання налаштувань сайту
 * Використовується в Server Components та API routes
 */
export async function getSiteSettingsServer(): Promise<ServerSiteSettings> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("app_settings").select("*").single()

    if (error) {
      console.error("Error fetching site settings:", error)
      return {
        defaultLanguage: "uk",
        siteLogo: "",
        siteFavicon: "/favicon.ico",
      }
    }

    return {
      defaultLanguage: data?.default_language || "uk",
      siteLogo: data?.site_logo || "",
      siteFavicon: data?.site_favicon || "/favicon.ico",
    }
  } catch (error) {
    console.error("Error in getSiteSettingsServer:", error)
    return {
      defaultLanguage: "uk",
      siteLogo: "",
      siteFavicon: "/favicon.ico",
    }
  }
}
