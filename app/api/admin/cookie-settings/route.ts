import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Отримуємо всі налаштування з app_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "google_analytics_id",
        "google_tag_manager_id",
        "facebook_pixel_id",
        "cookie_banner_enabled",
        "analytics_enabled",
        "marketing_enabled",
      ])

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 })
    }

    // Перетворюємо масив в об'єкт
    const settings = {
      google_analytics_id: "",
      google_tag_manager_id: "",
      facebook_pixel_id: "",
      cookie_banner_enabled: true,
      analytics_enabled: true,
      marketing_enabled: true,
    }

    settingsData?.forEach((setting) => {
      const key = setting.setting_key as keyof typeof settings
      if (key in settings) {
        if (typeof settings[key] === "boolean") {
          settings[key] = setting.setting_value === "true" || setting.setting_value === true
        } else {
          settings[key] = setting.setting_value || ""
        }
      }
    })

    return NextResponse.json(settings)
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

    // Зберігаємо кожне налаштування окремо
    const settingsToSave = [
      { key: "google_analytics_id", value: body.google_analytics_id || "" },
      { key: "google_tag_manager_id", value: body.google_tag_manager_id || "" },
      { key: "facebook_pixel_id", value: body.facebook_pixel_id || "" },
      { key: "cookie_banner_enabled", value: body.cookie_banner_enabled?.toString() || "true" },
      { key: "analytics_enabled", value: body.analytics_enabled?.toString() || "true" },
      { key: "marketing_enabled", value: body.marketing_enabled?.toString() || "true" },
    ]

    for (const setting of settingsToSave) {
      const { error } = await supabase.from("app_settings").upsert(
        {
          setting_key: setting.key,
          setting_value: setting.value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
