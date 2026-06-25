import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"

const SELECT_COLUMNS =
  "id, slug, title_cs, title_uk, title_en, content, is_active, required_at_registration, sort_order, created_at, updated_at"

function normalizeSlug(raw: unknown): string {
  return String(raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// GET — list every document (admin manager).
export async function GET() {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("legal_documents")
    .select(SELECT_COLUMNS)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching legal documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }

  return NextResponse.json({ documents: data })
}

// POST — create a new document.
export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const slug = normalizeSlug(body.slug)

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 })
  }
  if (!body.title_cs?.trim()) {
    return NextResponse.json({ error: "Czech title is required" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: existing } = await supabase.from("legal_documents").select("id").eq("slug", slug).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: "A document with this slug already exists" }, { status: 409 })
  }

  const { data, error } = await supabase
    .from("legal_documents")
    .insert({
      slug,
      title_cs: body.title_cs ?? "",
      title_uk: body.title_uk ?? "",
      title_en: body.title_en ?? "",
      content: body.content ?? "",
      is_active: body.is_active ?? true,
      required_at_registration: body.required_at_registration ?? false,
      sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
    })
    .select(SELECT_COLUMNS)
    .single()

  if (error) {
    console.error("Error creating legal document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ document: data })
}
