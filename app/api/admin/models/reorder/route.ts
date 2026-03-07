import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateUtils } from "@/lib/revalidate-utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { models } = body
    const supabase = createClient()

    // Update each model's position
    for (const model of models) {
      const { error } = await supabase.from("models").update({ position: model.position }).eq("id", model.id)

      if (error) throw error
    }
    // Target precise paths instead of full layout. Without explicit brand/series,
    // we use a generic broader fallback because reorder can affect multiple unknown items visually.
    revalidateUtils.revalidateBrand()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering models:", error)
    return NextResponse.json({ error: "Failed to reorder models" }, { status: 500 })
  }
}
