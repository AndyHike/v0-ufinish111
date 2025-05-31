import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("series").select("*, brands(name)").eq("id", params.id).single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching series:", error)
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("series")
      .update({
        name: body.name,
        brand_id: body.brand_id,
        position: body.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      entityId: params.id,
      entityType: "series",
      actionType: "update",
      userId: body.userId || null,
      details: { name: data.name },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating series:", error)
    return NextResponse.json({ error: "Failed to update series" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get series info before deletion for logging
    const { data: seriesData } = await supabase.from("series").select("name, brand_id").eq("id", params.id).single()

    const { error } = await supabase.from("series").delete().eq("id", params.id)

    if (error) throw error

    // Log activity
    if (seriesData) {
      await logActivity({
        entityId: params.id,
        entityType: "series",
        actionType: "delete",
        userId: null,
        details: { name: seriesData.name, brand_id: seriesData.brand_id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting series:", error)
    return NextResponse.json({ error: "Failed to delete series" }, { status: 500 })
  }
}
