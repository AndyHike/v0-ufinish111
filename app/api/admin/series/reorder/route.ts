import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateUtils } from "@/lib/revalidate-utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    if (!body.series || !Array.isArray(body.series)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Update positions for all series in the request
    for (const item of body.series) {
      if (!item.id || item.position === undefined) continue

      const { error } = await supabase
        .from("series")
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq("id", item.id)

      if (error) throw error
    }
    // Target precise paths instead of full layout. Without explicit brand,
    // we use a generic broader fallback because reorder can affect multiple unknown brands visually.
    // For maximum safety with targeted approach, we could iterate, 
    // but revalidateBrand with no arguments clears the `/brands` list where series might also be affected.
    revalidateUtils.revalidateBrand()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering series:", error)
    return NextResponse.json({ error: "Failed to reorder series" }, { status: 500 })
  }
}
