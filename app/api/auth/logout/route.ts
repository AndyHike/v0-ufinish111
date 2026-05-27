import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes("placeholder.supabase.co") && key !== "placeholder-key")
}

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session_id")?.value

  if (sessionId && hasSupabaseConfig()) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!,
      { auth: { persistSession: false } },
    )

    const { error } = await supabase.from("sessions").delete().eq("id", sessionId)
    if (error) {
      console.warn("Logout session cleanup failed:", error.message)
    }
  }

  cookieStore.delete("session_id")
  cookieStore.delete("user_role")

  return NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  )
}
