import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Публічний endpoint - без потреби аутентифікації
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "google_tag_manager_id",
        "facebook_pixel_id",
      ])

    if (error) {
      console.warn("[v0] Failed to fetch public settings:", error)
      return NextResponse.json({ 
        google_tag_manager_id: "",
        facebook_pixel_id: "",
      })
    }

    const settingsObj =
      settings?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, any>,
      ) || {}

    return NextResponse.json({
      google_tag_manager_id: settingsObj.google_tag_manager_id || "",
      facebook_pixel_id: settingsObj.facebook_pixel_id || "",
    })
  } catch (error) {
    console.warn("[v0] Error in public settings endpoint:", error)
    return NextResponse.json({ 
      google_tag_manager_id: "",
      facebook_pixel_id: "",
    })
  }
}
