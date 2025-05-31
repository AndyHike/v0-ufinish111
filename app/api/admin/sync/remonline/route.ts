import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { syncClientToRemonline, updateRemonlineIdForUser } from "@/lib/services/remonline-sync"
import { getSession } from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    // Check if the user is an admin
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get users without RemOnline ID
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id, 
        email, 
        name,
        profiles!inner(phone, address)
      `)
      .is("remonline_id", null)
      .limit(10) // Process in batches

    if (error) {
      console.error("Error fetching users to sync:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    console.log(`Found ${users.length} users to sync with RemOnline`)

    const results = []

    // Process each user
    for (const user of users) {
      const userData = {
        first_name: user.name?.split(" ")[0] || "",
        last_name: user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email,
        phone: user.profiles?.phone ? [user.profiles.phone] : [],
        address: user.profiles?.address || "",
      }

      const result = await syncClientToRemonline(userData)

      if (result.success && result.remonlineId) {
        await updateRemonlineIdForUser(user.id, result.remonlineId)
        results.push({
          userId: user.id,
          email: user.email,
          status: "synced",
          remonlineId: result.remonlineId,
        })
      } else {
        results.push({
          userId: user.id,
          email: user.email,
          status: "failed",
          error: result.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
    })
  } catch (error) {
    console.error("Error syncing users with RemOnline:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync users with RemOnline",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
