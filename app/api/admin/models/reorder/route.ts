import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering models:", error)
    return NextResponse.json({ error: "Failed to reorder models" }, { status: 500 })
  }
}
