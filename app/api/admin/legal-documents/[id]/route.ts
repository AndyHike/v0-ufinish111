import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"

const SELECT_COLUMNS =
  "id, slug, title_cs, title_uk, title_en, content, is_active, required_at_registration, sort_order, created_at, updated_at"

type RouteParams = { params: Promise<{ id: string }> }

// PUT — update an existing document. Slug is intentionally immutable.
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  for (const key of ["title_cs", "title_uk", "title_en", "content"] as const) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active)
  if (body.required_at_registration !== undefined) {
    update.required_at_registration = Boolean(body.required_at_registration)
  }
  if (body.sort_order !== undefined && Number.isFinite(body.sort_order)) {
    update.sort_order = body.sort_order
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("legal_documents")
    .update(update)
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .single()

  if (error) {
    console.error("Error updating legal document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ document: data })
}

// DELETE — remove a document.
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createClient()
  const { error } = await supabase.from("legal_documents").delete().eq("id", id)

  if (error) {
    console.error("Error deleting legal document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ success: true })
}
