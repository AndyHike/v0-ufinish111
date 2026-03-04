import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"
import { revalidateModelPages } from "@/lib/revalidate-helpers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const supabase = createClient()

    const { data, error } = await supabase.from("models").select("*, brands(name), series(name)").eq("id", id).single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching model:", error)
    return NextResponse.json({ error: "Failed to fetch model" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const supabase = createClient()

    const { data, error } = await supabase
      .from("models")
      .update({
        name: body.name,
        brand_id: body.brandId,
        series_id: body.seriesId || null,
        image_url: body.imageUrl,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      entityId: id,
      entityType: "model",
      actionType: "update",
      userId: body.userId || null,
      details: { name: data.name },
    })

    // Revalidate model + parent pages
    let seriesSlug: string | null = null
    let brandSlug: string | null = null
    if (data.series_id) {
      const { data: seriesData } = await supabase.from("series").select("slug").eq("id", data.series_id).single()
      seriesSlug = seriesData?.slug || null
    }
    if (data.brand_id) {
      const { data: brandData } = await supabase.from("brands").select("slug").eq("id", data.brand_id).single()
      brandSlug = brandData?.slug || null
    }
    revalidateModelPages(data.slug, seriesSlug, brandSlug)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating model:", error)
    return NextResponse.json({ error: "Failed to update model" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const supabase = createClient()

    // Get model info before deletion for logging and revalidation
    const { data: modelData } = await supabase.from("models").select("name, slug, series_id, brand_id").eq("id", id).single()

    const { error } = await supabase.from("models").delete().eq("id", id)

    if (error) throw error

    // Log activity
    if (modelData) {
      await logActivity({
        entityId: id,
        entityType: "model",
        actionType: "delete",
        userId: null, // We don't have userId in the request
        details: { name: modelData.name },
      })
    }

    // Revalidate model + parent pages
    if (modelData) {
      let seriesSlug: string | null = null
      let brandSlug: string | null = null
      if (modelData.series_id) {
        const { data: seriesData } = await supabase.from("series").select("slug").eq("id", modelData.series_id).single()
        seriesSlug = seriesData?.slug || null
      }
      if (modelData.brand_id) {
        const { data: brandData } = await supabase.from("brands").select("slug").eq("id", modelData.brand_id).single()
        brandSlug = brandData?.slug || null
      }
      revalidateModelPages(modelData.slug, seriesSlug, brandSlug)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting model:", error)
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 })
  }
}
