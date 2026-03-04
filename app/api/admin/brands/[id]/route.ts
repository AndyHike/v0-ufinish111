import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateBrandPages } from "@/lib/revalidate-helpers"
import { generateSlug } from "@/lib/slug-utils"

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
        slug: body.slug || generateSlug(body.name),
        logo_url: body.logo_url,
        position: body.position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    // Revalidate brand pages
    revalidateBrandPages(data.slug)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating brand:", error)
    return NextResponse.json({ error: "Failed to update brand" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Fetch brand slug before deletion for revalidation
    const { data: brandData } = await supabase.from("brands").select("slug").eq("id", params.id).single()

    const { error } = await supabase.from("brands").delete().eq("id", params.id)

    if (error) throw error

    // Revalidate brand pages
    revalidateBrandPages(brandData?.slug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting brand:", error)
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 })
  }
}
