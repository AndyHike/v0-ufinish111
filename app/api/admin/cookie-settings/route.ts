import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("site_settings").select("*").eq("key", "cookie_settings").single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching cookie settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    const settings = data?.value || {
      google_analytics_id: "",
      google_tag_manager_id: "",
      facebook_pixel_id: "",
      cookie_banner_enabled: true,
      analytics_enabled: true,
      marketing_enabled: true,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error in cookie settings GET:", error)
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

    const { error } = await supabase.from("site_settings").upsert({
      key: "cookie_settings",
      value: body,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving cookie settings:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in cookie settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
