import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/client"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { data, error } = await supabase.from("site_settings").select("*").eq("key", "cookie_settings").single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    const settings = data?.value || {
      googleAnalyticsId: "",
      googleTagManagerId: "",
      facebookPixelId: "",
      cookieBannerEnabled: true,
      cookieConsentVersion: "1.0",
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching cookie settings:", error)
    return NextResponse.json({ error: "Failed to fetch cookie settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await request.json()
    const supabase = createClient()

    const { error } = await supabase.from("site_settings").upsert({
      key: "cookie_settings",
      value: settings,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving cookie settings:", error)
    return NextResponse.json({ error: "Failed to save cookie settings" }, { status: 500 })
  }
}
