import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateModelPages } from "@/lib/revalidate-helpers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { models } = body
    const supabase = createClient()

    // Update each model's position
    for (const model of models) {
      const { error } = await supabase.from("models").update({ position: model.position }).eq("id", model.id)

      if (error) throw error
    }

    // Fetch parent series and brand slugs for revalidation
    let seriesSlug: string | null = null
    let brandSlug: string | null = null
    if (models.length > 0) {
      const { data: modelData } = await supabase
        .from("models")
        .select("series_id, brand_id")
        .eq("id", models[0].id)
        .single()
      if (modelData?.series_id) {
        const { data: seriesData } = await supabase.from("series").select("slug").eq("id", modelData.series_id).single()
        seriesSlug = seriesData?.slug || null
      }
      if (modelData?.brand_id) {
        const { data: brandData } = await supabase.from("brands").select("slug").eq("id", modelData.brand_id).single()
        brandSlug = brandData?.slug || null
      }
    }

    // Revalidate model + parent pages
    revalidateModelPages(null, seriesSlug, brandSlug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering models:", error)
    return NextResponse.json({ error: "Failed to reorder models" }, { status: 500 })
  }
}

