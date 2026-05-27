import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// ISR cache - 1 hour for site settings
export const revalidate = 3600

const DEFAULT_SITE_SETTINGS = {
  defaultLanguage: "uk",
  siteLogo: "/placeholder-logo.png",
  siteFavicon: "/favicon.ico",
}

function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes("placeholder.supabase.co") && key !== "placeholder-key")
}

export async function GET() {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(DEFAULT_SITE_SETTINGS)
    }

    const supabase = createClient()

    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["default_language", "site_logo", "site_favicon"])

    if (error) {
      console.warn("Error fetching site settings:", error)
      return NextResponse.json(DEFAULT_SITE_SETTINGS)
    }

    // Convert array to object for easier access
    const settingsObj =
      settings?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, string>,
      ) || {}

    return NextResponse.json({
      defaultLanguage: settingsObj.default_language || "uk",
      siteLogo: settingsObj.site_logo || "/placeholder-logo.png",
      siteFavicon: settingsObj.site_favicon || "/favicon.ico",
    })
  } catch (error) {
    console.warn("Error in site settings API:", error)
    return NextResponse.json(DEFAULT_SITE_SETTINGS)
  }
}
