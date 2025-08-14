import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const sessionId = request.headers.get("cookie")?.match(/session_id=([^;]+)/)?.[1]

    if (sessionId) {
      const supabase = createClient()

      // Delete session from database
      await supabase.from("sessions").delete().eq("id", sessionId)
    }

    // Clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set("session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // This deletes the cookie
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error in logout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
