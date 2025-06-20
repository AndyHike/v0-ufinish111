import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["default_language", "site_logo", "site_favicon"])

    if (error) {
      console.error("Error fetching site settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
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
      siteLogo: settingsObj.site_logo || "/placeholder-logo.svg",
      siteFavicon: settingsObj.site_favicon || "/favicon.ico",
    })
  } catch (error) {
    console.error("Error in site settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
