import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase" // серверний singleton

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: service, error } = await supabase
    .from("services")
    .select(
      `
      id,
      slug,
      price,
      warranty,
      icon_url,
      services_translations!inner(name,description)
    `,
    )
    .eq("slug", params.slug)
    .single()

  if (error || !service) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  return NextResponse.json(service)
}
