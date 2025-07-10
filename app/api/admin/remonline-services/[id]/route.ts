import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { service_id, brand_id, series_id, model_id, needs_review } = body

    const supabase = createClient()

    const { data: service, error } = await supabase
      .from("remonline_services")
      .update({
        service_id: service_id || null,
        brand_id: brand_id || null,
        series_id: series_id || null,
        model_id: model_id || null,
        needs_review: needs_review || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating RemOnline service:", error)
      return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Error in PUT /api/admin/remonline-services/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
