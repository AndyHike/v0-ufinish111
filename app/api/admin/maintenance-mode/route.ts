import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

// GET endpoint to retrieve maintenance mode settings
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: settings, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "maintenance_mode_enabled",
        "maintenance_mode_title",
        "maintenance_mode_message",
        "maintenance_mode_estimated_completion",
      ])

    if (error) {
      console.error("Error fetching maintenance settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Convert array to object
    const settingsObj = settings.reduce(
      (acc, setting) => {
        const key = setting.key.replace("maintenance_mode_", "")
        acc[key] = setting.value
        return acc
      },
      {} as Record<string, string>,
    )

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error("Error in maintenance mode GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint to update maintenance mode settings
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { enabled, title, message, estimated_completion } = await request.json()

    const supabase = createClient()

    // Update or insert each setting
    const settings = [
      { key: "maintenance_mode_enabled", value: enabled },
      { key: "maintenance_mode_title", value: title },
      { key: "maintenance_mode_message", value: message },
      { key: "maintenance_mode_estimated_completion", value: estimated_completion },
    ]

    for (const setting of settings) {
      const { data: existingSetting } = await supabase.from("app_settings").select("id").eq("key", setting.key).single()

      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from("app_settings")
          .update({ value: setting.value, updated_at: new Date().toISOString() })
          .eq("key", setting.key)

        if (error) {
          console.error(`Error updating setting ${setting.key}:`, error)
          return NextResponse.json({ error: `Failed to update ${setting.key}` }, { status: 500 })
        }
      } else {
        // Insert new setting
        const { error } = await supabase.from("app_settings").insert({ key: setting.key, value: setting.value })

        if (error) {
          console.error(`Error inserting setting ${setting.key}:`, error)
          return NextResponse.json({ error: `Failed to insert ${setting.key}` }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in maintenance mode POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
