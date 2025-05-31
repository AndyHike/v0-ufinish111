import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { formatImageUrl } from "@/utils/image-url"

export async function GET() {
  try {
    const supabase = createClient()

    // First try to get brands ordered by position
    let { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("position", { ascending: true, nullsLast: true })

    // If there's an error or no brands with position, try fetching without ordering
    if (error || !data || data.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase.from("brands").select("*").order("name")

      if (fallbackError) throw fallbackError
      data = fallbackData
    }

    // Sort brands by position if available, otherwise by name
    const sortedData = data
      .sort((a, b) => {
        // If both have position, sort by position
        if (a.position !== null && a.position !== undefined && b.position !== null && b.position !== undefined) {
          return a.position - b.position
        }
        // If only one has position, prioritize the one with position
        if (a.position !== null && a.position !== undefined) return -1
        if (b.position !== null && b.position !== undefined) return 1
        // If neither has position, sort by name
        return a.name.localeCompare(b.name)
      })
      .map((brand) => ({
        ...brand,
        logo_url: brand.logo_url ? formatImageUrl(brand.logo_url) : null,
      }))

    return NextResponse.json(sortedData)
  } catch (error) {
    console.error("Error fetching brands:", error)
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Get the current user for activity logging
    const session = await getSession()
    const userId = session?.user?.id

    // Get the highest position value
    const { data: existingBrands, error: fetchError } = await supabase
      .from("brands")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError

    const nextPosition =
      existingBrands && existingBrands.length > 0 && existingBrands[0].position !== null
        ? (existingBrands[0].position || 0) + 1
        : 1

    const { data, error } = await supabase
      .from("brands")
      .insert([
        {
          name: body.name,
          logo_url: body.logo_url || null,
          position: body.position || nextPosition,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Log activity if user is logged in
    if (userId) {
      await supabase.from("activities").insert([
        {
          user_id: userId,
          action_type: "create",
          entity_type: "brand",
          entity_id: data.id,
          details: { name: data.name },
        },
      ])
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json({ error: "Failed to create brand" }, { status: 500 })
  }
}
