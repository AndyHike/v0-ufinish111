export class ClientService {
  constructor(private supabase: any) {}

  async createClient(clientData: any) {
    try {
      console.log(`👤 ClientService.createClient called with:`, clientData)

      const clientInfo = {
        remonline_id: clientData.id,
        email: clientData.email,
        first_name: clientData.first_name || "",
        last_name: clientData.last_name || "",
        phone: clientData.phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("👤 Creating client with data:", clientInfo)

      const { data: newClient, error: insertError } = await this.supabase
        .from("users")
        .insert(clientInfo)
        .select("id")
        .single()

      if (insertError) {
        console.error("❌ Error creating client:", insertError)
        throw new Error(`Failed to create client: ${insertError.message}`)
      }

      console.log(`✅ Client created successfully with ID: ${newClient.id}`)
      return newClient
    } catch (error) {
      console.error("💥 Error in createClient:", error)
      throw error
    }
  }

  async updateClient(remonlineClientId: number, clientData: any) {
    try {
      console.log(`👤 ClientService.updateClient called for client ${remonlineClientId}`)

      const updateData = {
        email: clientData.email,
        first_name: clientData.first_name || "",
        last_name: clientData.last_name || "",
        phone: clientData.phone || null,
        updated_at: new Date().toISOString(),
      }

      console.log("👤 Updating client with data:", updateData)

      const { error: updateError } = await this.supabase
        .from("users")
        .update(updateData)
        .eq("remonline_id", remonlineClientId)

      if (updateError) {
        console.error("❌ Error updating client:", updateError)
        throw new Error(`Failed to update client: ${updateError.message}`)
      }

      console.log(`✅ Client ${remonlineClientId} updated successfully`)
    } catch (error) {
      console.error("💥 Error in updateClient:", error)
      throw error
    }
  }

  async deleteClient(remonlineClientId: number) {
    try {
      console.log(`👤 Deleting client ${remonlineClientId}`)

      const { error: deleteError } = await this.supabase.from("users").delete().eq("remonline_id", remonlineClientId)

      if (deleteError) {
        console.error("❌ Error deleting client:", deleteError)
        throw new Error(`Failed to delete client: ${deleteError.message}`)
      }

      console.log(`✅ Client ${remonlineClientId} deleted successfully`)
    } catch (error) {
      console.error("💥 Error in deleteClient:", error)
      throw error
    }
  }
}
