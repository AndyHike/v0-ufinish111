import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"
import { revalidateUtils } from "@/lib/revalidate-utils"
import { revalidatePath } from "next/cache"

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

    // Get model info before deletion for logging and cache clearing
    const { data: modelData } = await supabase.from("models").select("slug, name, brand_id, series_id").eq("id", id).single()

    const { error } = await supabase.from("models").delete().eq("id", id)

    if (error) throw error

    // Log activity
    if (modelData) {
      // Get the current user for activity logging if not provided in request
      // We don't have session here directly so we'll pass undefined and let logActivity handle it if needed
      await logActivity({
        entityId: id,
        entityType: "model",
        actionType: "delete",
        userId: "system", // Fallback, normally we'd get session
        details: { name: modelData.name },
      })
    }
    // Fetch necessary slugs for targeted invalidation
    if (modelData) {
      const { data: brandData } = await supabase.from("brands").select("slug").eq("id", modelData.brand_id).single()

      let seriesSlug = null
      if (modelData.series_id) {
        const { data: seriesData } = await supabase.from("series").select("slug").eq("id", modelData.series_id).single()
        if (seriesData) seriesSlug = seriesData.slug
      }

      if (brandData?.slug) {
        revalidateUtils.revalidateModel(brandData.slug, seriesSlug, modelData.slug)
      } else {
        revalidateUtils.revalidateBrand()
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting model:", error)
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 })
  }
}
