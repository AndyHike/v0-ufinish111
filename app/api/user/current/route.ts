import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const user = await getCurrentUser()

    console.log("[v0] API /user/current - User:", user ? `${user.email} (${user.role})` : "null")

    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    return NextResponse.json(
      { user },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
