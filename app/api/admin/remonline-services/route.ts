import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const needsReview = searchParams.get("needs_review") === "true"
    const search = searchParams.get("search") || ""

    const supabase = createClient()

    let query = supabase.from("remonline_services").select(`
        *,
        service:services(id, slug, name),
        brand:brands(id, slug, name),
        series:series(id, slug, name),
        model:models(id, slug, name)
      `)

    if (needsReview) {
      query = query.eq("needs_review", true)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,barcode.ilike.%${search}%`)
    }

    const {
      data: services,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Error fetching RemOnline services:", error)
      return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
    }

    return NextResponse.json({
      services,
      total: count,
      page,
      limit,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/remonline-services:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
