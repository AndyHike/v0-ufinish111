import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { z } from "zod"

// Define a schema for the RemOnline webhook payload for account deletion
const remonlineDeleteWebhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  event_name: z.string(),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  employee: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Save original request for logging
    const clonedRequest = request.clone()
    const payload = await clonedRequest.json()
    console.log("RemOnline delete account webhook received:", payload)

    // Validate the webhook payload against the schema
    const parsedPayload = remonlineDeleteWebhookSchema.safeParse(payload)

    if (!parsedPayload.success) {
      console.error("Invalid webhook payload:", parsedPayload.error)
      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsedPayload.error.errors },
        { status: 400 },
      )
    }

    // Get the original request data
    const originalRequest = parsedPayload.data
    console.log("RemOnline webhook data:", originalRequest)

    // Check if this is a client deletion event
    if (originalRequest.event_name === "Client.Deleted") {
      const clientId = originalRequest.context.object_id

      // Handle client deletion
      await handleClientDeletion(clientId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: "Webhook received but no action taken" })
  } catch (error) {
    console.error("Error processing RemOnline delete webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function handleClientDeletion(remonlineClientId: number) {
  const supabase = createClient()

  try {
    // Find the user with this RemOnline ID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("remonline_id", remonlineClientId)
      .single()

    if (userError) {
      console.error("Error finding user with RemOnline ID:", userError)
      return { success: false, message: "User not found" }
    }

    if (user) {
      console.log(`Found user to delete: ${user.id} (${user.email})`)

      // IMPORTANT: Delete sessions from the database first
      // This avoids the need to modify cookies in the webhook handler
      const { error: sessionError } = await supabase.from("sessions").delete().eq("user_id", user.id)

      if (sessionError) {
        console.error("Error deleting user sessions:", sessionError)
      }

      // Delete profile
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)

      if (profileError) {
        console.error("Error deleting user profile:", profileError)
      }

      // Delete user
      const { error: deleteError } = await supabase.from("users").delete().eq("id", user.id)

      if (deleteError) {
        console.error("Error deleting user:", deleteError)
        return { success: false, message: "Failed to delete user" }
      }

      console.log(`Successfully deleted user ${user.id} from RemOnline webhook`)
      return { success: true }
    } else {
      console.log(`No user found with RemOnline ID: ${remonlineClientId}`)
      return { success: true, message: "No user found to delete" }
    }
  } catch (error) {
    console.error("Error in handleClientDeletion:", error)
    return { success: false, message: error instanceof Error ? error.message : String(error) }
  }
}
