export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("promotional_banners")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return NextResponse.json(data || null)
  } catch (error) {
    console.error("Error fetching banner:", error)
    return NextResponse.json({ error: "Failed to fetch banner" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Check if banner exists
    const { data: existingBanner } = await supabase
      .from("promotional_banners")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (existingBanner) {
      // Update existing banner
      const { error } = await supabase
        .from("promotional_banners")
        .update({
          enabled: body.enabled,
          color: body.color,
          text_cs: body.text_cs,
          text_en: body.text_en,
          text_uk: body.text_uk,
          button_text_cs: body.button_text_cs,
          button_text_en: body.button_text_en,
          button_text_uk: body.button_text_uk,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBanner.id)

      if (error) throw error
    } else {
      // Create new banner
      const { error } = await supabase.from("promotional_banners").insert([body])

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving banner:", error)
    return NextResponse.json({ error: "Failed to save banner" }, { status: 500 })
  }
}
