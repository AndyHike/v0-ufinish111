import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  try {
    const supabase = createClient()

    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "google_analytics_id",
        "google_tag_manager_id",
        "facebook_pixel_id",
        "cookie_banner_enabled",
        "analytics_enabled",
        "marketing_enabled",
      ])

    if (error) {
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    const settingsObj =
      settings?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, any>,
      ) || {}

    const cookieSettings = {
      google_analytics_id: settingsObj.google_analytics_id || "",
      google_tag_manager_id: settingsObj.google_tag_manager_id || "",
      facebook_pixel_id: settingsObj.facebook_pixel_id || "",
      cookie_banner_enabled: settingsObj.cookie_banner_enabled !== "false",
      analytics_enabled: settingsObj.analytics_enabled !== "false",
      marketing_enabled: settingsObj.marketing_enabled !== "false",
    }

    return NextResponse.json(cookieSettings)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createClient()

    for (const [key, value] of Object.entries(body)) {
      const { data: existing } = await supabase.from("app_settings").select("key").eq("key", key).single()

      if (existing) {
        const { error: updateError } = await supabase
          .from("app_settings")
          .update({
            value: String(value),
            updated_at: new Date().toISOString(),
          })
          .eq("key", key)

        if (updateError) {
          throw updateError
        }
      } else {
        const { error: insertError } = await supabase.from("app_settings").insert({
          key,
          value: String(value),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          throw insertError
        }
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
