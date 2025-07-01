import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { updateRemonlineIdForUser } from "@/lib/services/remonline-sync"
import { getSession } from "@/lib/auth/session"
import remonline from "@/lib/api/remonline"

export async function POST(request: Request) {
  try {
    // Check if the user is an admin
    const session = await getSession()
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting admin RemOnline sync...")

    // Test API connection first
    const connectionTest = await remonline.testConnection()
    if (!connectionTest.success) {
      console.error("RemOnline API connection test failed:", connectionTest.message)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to RemOnline API",
          details: connectionTest.message,
        },
        { status: 500 },
      )
    }

    console.log("RemOnline API connection successful")

    const supabase = createClient()

    // Get users without RemOnline ID
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id, 
        email, 
        name,
        first_name,
        last_name,
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
      try {
        // First, check if client already exists in RemOnline by email
        const existingClient = await remonline.getClientByEmail(user.email)

        if (existingClient.success && existingClient.exists && existingClient.client) {
          // Client already exists, just update our database with the RemOnline ID
          await updateRemonlineIdForUser(user.id, existingClient.client.id)
          results.push({
            userId: user.id,
            email: user.email,
            status: "linked",
            remonlineId: existingClient.client.id,
            message: "Linked to existing RemOnline client",
          })
          console.log(`Linked user ${user.id} to existing RemOnline client ${existingClient.client.id}`)
          continue
        }

        // Client doesn't exist, create new one
        const userData = {
          first_name: user.first_name || user.name?.split(" ")[0] || "",
          last_name: user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
          email: user.email,
          phone: user.profiles?.phone ? [user.profiles.phone] : [],
          address: user.profiles?.address || "",
        }

        console.log(`Creating new RemOnline client for user ${user.id}:`, userData)

        const createResult = await remonline.createClient(userData)

        if (createResult.success && createResult.client) {
          await updateRemonlineIdForUser(user.id, createResult.client.id)
          results.push({
            userId: user.id,
            email: user.email,
            status: "created",
            remonlineId: createResult.client.id,
            message: "Created new RemOnline client",
          })
          console.log(`Created new RemOnline client ${createResult.client.id} for user ${user.id}`)
        } else {
          results.push({
            userId: user.id,
            email: user.email,
            status: "failed",
            error: createResult.message,
          })
          console.error(`Failed to create RemOnline client for user ${user.id}:`, createResult.message)
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
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
