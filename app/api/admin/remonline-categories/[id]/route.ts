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
    const { category_title, description } = body

    if (!category_title) {
      return NextResponse.json({ error: "Category title is required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: category, error } = await supabase
      .from("remonline_categories")
      .update({
        category_title,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating RemOnline category:", error)
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in PUT /api/admin/remonline-categories/[id]:", error)
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
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/remonline-categories/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
