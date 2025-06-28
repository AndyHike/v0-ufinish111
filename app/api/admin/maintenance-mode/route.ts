import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
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

    const settingsObj =
      settings?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, string>,
      ) || {}

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error("Error in maintenance mode GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, title, message, estimated_completion } = body

    const supabase = createClient()

    // Prepare settings to upsert
    const settingsToUpdate = [
      { key: "maintenance_mode_enabled", value: enabled },
      { key: "maintenance_mode_title", value: title },
      { key: "maintenance_mode_message", value: message },
      { key: "maintenance_mode_estimated_completion", value: estimated_completion },
    ]

    const { error } = await supabase.from("app_settings").upsert(settingsToUpdate, { onConflict: "key" })

    if (error) {
      console.error("Error updating maintenance settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in maintenance mode POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
