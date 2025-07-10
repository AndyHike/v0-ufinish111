import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { category_title, association_type, target_id } = body

    if (!category_title || !association_type || !target_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["brand", "series"].includes(association_type)) {
      return NextResponse.json({ error: "Invalid association type" }, { status: 400 })
    }

    const supabase = createClient()

    // Verify target exists
    const targetTable = association_type === "brand" ? "brands" : "series"
    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select("id, name")
      .eq("id", target_id)
      .single()

    if (targetError || !target) {
      return NextResponse.json({ error: `${association_type} not found` }, { status: 404 })
    }

    // Update association
    const { data: category, error } = await supabase
      .from("remonline_categories")
      .update({
        category_title,
        association_type,
        target_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating RemOnline category:", error)
      return NextResponse.json({ error: "Failed to update category association" }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in PUT /api/admin/remonline-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { error } = await supabase.from("remonline_categories").delete().eq("id", params.id)

    if (error) {
      console.error("Error deleting RemOnline category:", error)
      return NextResponse.json({ error: "Failed to delete category association" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/remonline-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
