import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()

    const { service_id, position = 0 } = body

    if (!service_id) {
      return NextResponse.json(
        { error: "Missing service_id" },
        { status: 400 }
      )
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from("article_service_links")
      .select("id")
      .eq("article_id", id)
      .eq("service_id", service_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Service link already exists" },
        { status: 400 }
      )
    }

    const { data: link, error } = await supabase
      .from("article_service_links")
      .insert({
        article_id: id,
        service_id,
        position,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error("Error adding service link:", error)
    return NextResponse.json(
      { error: "Failed to add service link" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data: links, error } = await supabase
      .from("article_service_links")
      .select(
        `
        id,
        service_id,
        position,
        services(
          id,
          slug,
          name,
          image_url,
          warranty_months,
          duration_hours,
          services_translations(
            locale,
            name,
            description,
            detailed_description,
            what_included,
            benefits
          )
        )
      `
      )
      .eq("article_id", id)
      .order("position")

    if (error) throw error

    return NextResponse.json(links || [])
  } catch (error) {
    console.error("Error fetching service links:", error)
    return NextResponse.json(
      { error: "Failed to fetch service links" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()
    const body = await request.json()
    const { service_id } = body

    if (!service_id) {
      return NextResponse.json(
        { error: "Missing service_id" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("article_service_links")
      .delete()
      .eq("article_id", id)
      .eq("service_id", service_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing service link:", error)
    return NextResponse.json(
      { error: "Failed to remove service link" },
      { status: 500 }
    )
  }
}
