import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateUtils } from "@/lib/revalidate-utils"
import { revalidatePath } from "next/cache"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("brands").select("*").eq("id", params.id).single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching brand:", error)
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("brands")
      .update({
        name: body.name,
        logo_url: body.logo_url,
        position: body.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error
    // Revalidate paths to update UI instantly
    revalidatePath("/", "layout")

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating brand:", error)
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    // Get brand info before deletion to know which paths to clear
    const { data: brandData } = await supabase.from("brands").select("slug").eq("id", params.id).single()

    const { error } = await supabase.from("brands").delete().eq("id", params.id)

    if (error) throw error
    // Revalidate paths to update UI instantly
    revalidatePath("/", "layout")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting brand:", error)
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 })
  }
}
