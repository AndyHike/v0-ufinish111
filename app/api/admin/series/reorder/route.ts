import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { revalidateSeriesPages } from "@/lib/revalidate-helpers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    if (!body.series || !Array.isArray(body.series)) {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    // Update positions for all series in the request
    for (const item of body.series) {
      if (!item.id || item.position === undefined) continue

      const { error } = await supabase
        .from("series")
        .update({ position: item.position, updated_at: new Date().toISOString() })
        .eq("id", item.id)

      if (error) throw error
    }

    // Fetch parent brand slug for revalidation
    let brandSlug: string | null = null
    if (body.series.length > 0) {
      const { data: seriesData } = await supabase
        .from("series")
        .select("brand_id, brands(slug)")
        .eq("id", body.series[0].id)
        .single()
      const brandsObj = Array.isArray(seriesData?.brands) ? seriesData.brands[0] : seriesData?.brands
      brandSlug = brandsObj?.slug || null
    }

    // Revalidate series + parent brand pages
    revalidateSeriesPages(null, brandSlug)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering series:", error)
    return NextResponse.json({ error: "Failed to reorder series" }, { status: 500 })
  }
}

