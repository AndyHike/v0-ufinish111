import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  try {
    console.log("API: Fetching cookie settings...")
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
      console.error("API: Error fetching cookie settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    console.log("API: Raw settings from DB:", settings)

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

    console.log("API: Processed cookie settings:", cookieSettings)
    return NextResponse.json(cookieSettings)
  } catch (error) {
    console.error("API: Error in cookie settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("API: Saving cookie settings...")
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      console.log("API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("API: Settings to save:", body)

    const supabase = createClient()

    for (const [key, value] of Object.entries(body)) {
      console.log(`API: Processing ${key} = ${value}`)

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
          console.error(`API: Error updating ${key}:`, updateError)
          throw updateError
        } else {
          console.log(`API: Updated ${key} successfully`)
        }
      } else {
        const { error: insertError } = await supabase.from("app_settings").insert({
          key,
          value: String(value),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error(`API: Error inserting ${key}:`, insertError)
          throw insertError
        } else {
          console.log(`API: Inserted ${key} successfully`)
        }
      }
    }

    console.log("API: All settings saved successfully")
    return NextResponse.json({ success: true, message: "Settings saved successfully" })
  } catch (error) {
    console.error("API: Error in cookie settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
