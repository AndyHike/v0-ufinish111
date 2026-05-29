import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncUserToRemonline } from "@/lib/services/remonline-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = (await params).id
  const result = await syncUserToRemonline(id)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
