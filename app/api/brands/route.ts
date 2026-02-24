import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    console.log("[v0] Fetching brands from Supabase...")

    // Get brands ordered by position
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url, position")
      .order("position", { ascending: true, nullsLast: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching brands:", error)
      return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
    }

    console.log(`[v0] Successfully fetched ${data?.length || 0} brands`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error fetching brands:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
