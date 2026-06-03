import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const revalidate = 0

const USER_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    console.log("[v0] API /user/current - User:", user ? `${user.email} (${user.role})` : "null")

    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: USER_RESPONSE_HEADERS,
        },
      )
    }

    return NextResponse.json(
      { user },
      {
        status: 200,
        headers: USER_RESPONSE_HEADERS,
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
