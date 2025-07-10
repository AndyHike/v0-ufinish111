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

    // Get all category associations with related brand/series info
    const { data: categories, error } = await supabase
      .from("remonline_categories")
      .select(`
        *,
        brands!fk_remonline_categories_brand(id, name, slug),
        series!fk_remonline_categories_series(id, name, slug)
      `)
      .order("created_at", { ascending: false })

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
    const { category_id, category_title, association_type, target_id } = body

    if (!category_id || !category_title || !association_type || !target_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["brand", "series"].includes(association_type)) {
      return NextResponse.json({ error: "Invalid association type" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if category already exists
    const { data: existing } = await supabase
      .from("remonline_categories")
      .select("id")
      .eq("category_id", category_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Category association already exists" }, { status: 409 })
    }

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

    // Create association
    const { data: category, error } = await supabase
      .from("remonline_categories")
      .insert({
        category_id: Number.parseInt(category_id),
        category_title,
        association_type,
        target_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating RemOnline category:", error)
      return NextResponse.json({ error: "Failed to create category association" }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Error in POST /api/admin/remonline-categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
