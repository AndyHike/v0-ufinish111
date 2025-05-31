import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const brandId = url.searchParams.get("brand_id")

    const supabase = createClient()
    let query = supabase.from("series").select("*, brands(name)")

    if (brandId) {
      query = query.eq("brand_id", brandId)
    }

    const { data, error } = await query.order("position", { ascending: true, nullsLast: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching series:", error)
    return NextResponse.json({ error: "Failed to fetch series" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    // Get the current user for activity logging
    const session = await getSession()
    const userId = session?.user?.id

    // Get the highest position value
    const { data: existingSeries, error: fetchError } = await supabase
      .from("series")
      .select("position")
      .eq("brand_id", body.brand_id)
      .order("position", { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError

    const nextPosition =
      existingSeries && existingSeries.length > 0 && existingSeries[0].position !== null
        ? (existingSeries[0].position || 0) + 1
        : 1

    const { data, error } = await supabase
      .from("series")
      .insert([
        {
          name: body.name,
          brand_id: body.brand_id,
          position: body.position || nextPosition,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Log activity if user is logged in
    if (userId) {
      await logActivity({
        entityId: data.id,
        entityType: "series",
        actionType: "create",
        userId: userId,
        details: { name: data.name, brand_id: data.brand_id },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating series:", error)
    return NextResponse.json({ error: "Failed to create series" }, { status: 500 })
  }
}
