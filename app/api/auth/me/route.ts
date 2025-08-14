import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get("cookie")?.match(/session_id=([^;]+)/)?.[1]

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const supabase = createClient()

    // Get session and user data
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select(`
        id,
        user_id,
        expires_at,
        users (
          id,
          email,
          name,
          role
        )
      `)
      .eq("id", sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase.from("sessions").delete().eq("id", sessionId)
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json({
      user: session.users,
      session: {
        id: session.id,
        expires_at: session.expires_at,
      },
    })
  } catch (error) {
    console.error("Error in auth/me:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
