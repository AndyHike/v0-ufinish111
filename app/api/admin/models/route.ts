import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"
import { formatImageUrl } from "@/utils/image-url"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const brandId = searchParams.get("brand_id")
    const seriesId = searchParams.get("series_id")

    const supabase = createClient()
    let query = supabase.from("models").select("*, brands(name), series(name)")

    if (brandId) {
      query = query.eq("brand_id", brandId)
    }

    if (seriesId) {
      query = query.eq("series_id", seriesId)
    }

    const { data, error } = await query.order("position", { ascending: true, nullsLast: true })

    if (error) throw error

    // Форматуємо URL зображень
    const formattedData = data.map((model) => ({
      ...model,
      image_url: model.image_url ? formatImageUrl(model.image_url) : null,
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // Get the highest position value
    const { data: positionData } = await supabase
      .from("models")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)

    const nextPosition =
      positionData && positionData.length > 0 && positionData[0].position !== null ? positionData[0].position + 1 : 0

    const { data, error } = await supabase
      .from("models")
      .insert({
        name: body.name,
        brand_id: body.brandId,
        series_id: body.seriesId || null,
        image_url: body.imageUrl || null,
        position: nextPosition,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      entityId: data.id,
      entityType: "model",
      actionType: "create",
      userId: body.userId || null,
      details: { name: data.name },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating model:", error)
    return NextResponse.json({ error: "Failed to create model" }, { status: 500 })
  }
}
