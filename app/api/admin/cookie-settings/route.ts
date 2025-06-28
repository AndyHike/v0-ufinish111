import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

// GET endpoint to retrieve cookie settings
export async function GET() {
  try {
    const supabase = createClient()
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "googleAnalyticsId",
        "googleTagManagerId",
        "facebookPixelId",
        "cookieBannerEnabled",
        "cookieConsentVersion",
      ])

    if (error) {
      console.error("Error fetching cookie settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Convert array to object
    const settingsObj = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, any>,
    )

    // Set defaults
    const cookieSettings = {
      googleAnalyticsId: settingsObj.googleAnalyticsId || "",
      googleTagManagerId: settingsObj.googleTagManagerId || "",
      facebookPixelId: settingsObj.facebookPixelId || "",
      cookieBannerEnabled: settingsObj.cookieBannerEnabled !== "false",
      cookieConsentVersion: settingsObj.cookieConsentVersion || "1.0",
    }

    return NextResponse.json(cookieSettings)
  } catch (error) {
    console.error("Error in cookie settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint to update cookie settings
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await request.json()
    const supabase = createClient()

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const { data: existingSetting } = await supabase.from("app_settings").select("id").eq("key", key).single()

      if (existingSetting) {
        const { error: updateError } = await supabase
          .from("app_settings")
          .update({
            value: String(value),
            updated_at: new Date().toISOString(),
          })
          .eq("key", key)

        if (updateError) {
          console.error(`Error updating ${key}:`, updateError)
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
          console.error(`Error inserting ${key}:`, insertError)
          throw insertError
        }
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" })
  } catch (error) {
    console.error("Error in cookie settings POST:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
