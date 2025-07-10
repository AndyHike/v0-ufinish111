import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request, { params }: { params: { sessionId: string } }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: syncSession, error } = await supabase
      .from("remonline_sync_sessions")
      .select("*")
      .eq("session_id", params.sessionId)
      .single()

    if (error) {
      console.error("Error fetching sync session:", error)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ session: syncSession })
  } catch (error) {
    console.error("Error in GET /api/admin/sync/remonline-services/[sessionId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
