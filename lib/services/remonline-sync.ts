import remonline from "@/lib/api/remonline"

export async function syncClientToRemonline(userData: {
  first_name: string
  last_name: string
  email: string
  phone?: string[]
  address?: string
}) {
  try {
    console.log("Syncing client to RemOnline in background:", userData)

    // Ensure phone is in the correct format (array of strings)
    const formattedUserData = {
      ...userData,
      phone: Array.isArray(userData.phone) ? userData.phone : userData.phone ? [userData.phone] : [],
    }

    // Authenticate with RemOnline API
    const authResult = await remonline.auth()
    if (!authResult.success) {
      console.error("Failed to authenticate with RemOnline API:", authResult.message)
      return {
        success: false,
        message: "Failed to connect to RemOnline. Will retry later.",
      }
    }

    // Check if client already exists in RemOnline
    const emailCheckResult = await remonline.getClientByEmail(userData.email)

    if (emailCheckResult.success && emailCheckResult.exists && emailCheckResult.client) {
      console.log("Client already exists in RemOnline:", emailCheckResult.client)
      return {
        success: true,
        message: "Client already exists in RemOnline",
        remonlineId: emailCheckResult.client.id,
      }
    }

    // Create client in RemOnline
    console.log("Creating client in RemOnline with data:", formattedUserData)
    const response = await remonline.createClient(formattedUserData)
    console.log("Remonline createClient response:", response)

    if (!response.success) {
      console.error("Failed to create client in RemOnline:", response.message)
      return {
        success: false,
        message: response.message || "Failed to create client in RemOnline",
      }
    }

    console.log("Client created in RemOnline:", response.client)
    return {
      success: true,
      message: "Client created in RemOnline",
      remonlineId: response.client.id,
    }
  } catch (error) {
    console.error("Error syncing client to RemOnline:", error)
    return {
      success: false,
      message: "Error syncing client to RemOnline. Will retry later.",
    }
  }
}

export async function updateRemonlineIdForUser(userId: string, remonlineId: number) {
  try {
    const { createClient } = await import("@/lib/supabase")
    const supabase = createClient()

    const { data, error } = await supabase.from("users").update({ remonline_id: remonlineId }).eq("id", userId).select() // Select the updated record to log it

    if (error) {
      console.error("Error updating RemOnline ID for user:", error)
      return false
    }

    console.log(`Updated RemOnline ID for user ${userId}: ${remonlineId}`, data) // Log the updated record
    return true
  } catch (error) {
    console.error("Error updating RemOnline ID for user:", error)
    return false
  }
}
