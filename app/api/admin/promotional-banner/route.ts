export const dynamic = "force-dynamic"

import { createClient } from "@/utils/supabase/server"
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
      console.error("[v0] Banner GET error:", error)
      throw error
    }

    return NextResponse.json(data || null)
  } catch (error) {
    console.error("[v0] Error fetching banner:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch banner",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    console.log("[v0] Saving banner with data:", body)

    const { data: existingBanner, error: fetchError } = await supabase
      .from("promotional_banners")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error checking existing banner:", fetchError)
      throw fetchError
    }

    if (existingBanner) {
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

      if (error) {
        console.error("[v0] Error updating banner:", error)
        throw error
      }

      console.log("[v0] Banner updated successfully")
    } else {
      const { error } = await supabase.from("promotional_banners").insert([
        {
          enabled: body.enabled,
          color: body.color,
          text_cs: body.text_cs,
          text_en: body.text_en,
          text_uk: body.text_uk,
          button_text_cs: body.button_text_cs,
          button_text_en: body.button_text_en,
          button_text_uk: body.button_text_uk,
        },
      ])

      if (error) {
        console.error("[v0] Error creating banner:", error)
        throw error
      }

      console.log("[v0] Banner created successfully")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving banner:", error)
    return NextResponse.json(
      {
        error: "Failed to save banner",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
