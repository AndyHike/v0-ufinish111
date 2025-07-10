import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: categories, error } = await supabase.from("remonline_categories").select("*").order("category_title")

    if (error) {
      console.error("Error fetching RemOnline categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error in GET /api/admin/remonline-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { category_id, category_title, description } = body

    if (!category_id || !category_title) {
      return NextResponse.json({ error: "Category ID and title are required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: category, error } = await supabase
      .from("remonline_categories")
      .insert({
        category_id: Number.parseInt(category_id),
        category_title,
        description: description || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating RemOnline category:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in POST /api/admin/remonline-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
