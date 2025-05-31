import { createClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

// GET endpoint to retrieve all app settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user is authenticated and is an admin
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").select("*")

    if (error) {
      console.error("Error fetching app settings:", error)
      return NextResponse.json({ error: "Failed to fetch app settings" }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST endpoint to update a specific app setting
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    // Check if user is authenticated and is an admin
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key, value } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()
    const { data, error } = await supabase.from("app_settings").update({ value }).eq("key", key).select()

    if (error) {
      console.error("Error updating app setting:", error)
      return NextResponse.json({ error: "Failed to update app setting" }, { status: 500 })
    }

    return NextResponse.json({ setting: data[0] })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
