import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { brands } = body

    if (!brands || !Array.isArray(brands)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Update each brand's position
    const updatePromises = brands.map((brand) => {
      return supabase.from("brands").update({ position: brand.position }).eq("id", brand.id)
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering brands:", error)
    return NextResponse.json({ error: "Failed to reorder brands" }, { status: 500 })
  }
}
