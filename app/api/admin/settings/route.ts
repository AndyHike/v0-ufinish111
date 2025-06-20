import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

// GET endpoint to retrieve all app settings
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: settings, error } = await supabase.from("app_settings").select("*")

    if (error) {
      console.error("Error fetching settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error in settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint to update or insert a specific app setting
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    const supabase = createClient()

    // Try to update existing setting first
    const { data: existingSetting } = await supabase.from("app_settings").select("id").eq("key", key).single()

    if (existingSetting) {
      // Update existing setting
      const { error } = await supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)

      if (error) {
        console.error("Error updating setting:", error)
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
      }
    } else {
      // Insert new setting
      const { error } = await supabase.from("app_settings").insert({ key, value })

      if (error) {
        console.error("Error inserting setting:", error)
        return NextResponse.json({ error: "Failed to insert setting" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
