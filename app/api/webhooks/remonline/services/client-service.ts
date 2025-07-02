import { createClient } from "@/lib/supabase/server"

export interface ClientData {
  remonline_client_id: number
  fullname: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

export async function saveClientToDatabase(clientData: ClientData) {
  try {
    const supabase = createClient()

    const { data: client, error } = await supabase
      .from("remonline_clients")
      .upsert([clientData], { onConflict: "remonline_client_id" })
      .select()
      .single()

    if (error) {
      console.error("Error saving client:", error)
      throw error
    }

    console.log(`✅ Client ${clientData.fullname} saved successfully`)
    return { success: true, client }
  } catch (error) {
    console.error("💥 Error saving client to database:", error)
    throw error
  }
}

export async function getClientFromDatabase(clientId: number) {
  try {
    const supabase = createClient()

    const { data: client, error } = await supabase
      .from("remonline_clients")
      .select("*")
      .eq("remonline_client_id", clientId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching client:", error)
      throw error
    }

    return client
  } catch (error) {
    console.error("💥 Error fetching client from database:", error)
    throw error
  }
}

export async function linkClientToUser(remonlineClientId: number, userId: string) {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("remonline_clients")
      .update({ user_id: userId })
      .eq("remonline_client_id", remonlineClientId)

    if (error) {
      console.error("Error linking client to user:", error)
      throw error
    }

    console.log(`✅ Client ${remonlineClientId} linked to user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("💥 Error linking client to user:", error)
    throw error
  }
}
