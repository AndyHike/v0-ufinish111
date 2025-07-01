import { hash } from "@/lib/auth/utils"
import remonline from "@/lib/api/remonline"
import { clearUserSessionsByUserId } from "@/app/actions/session"

export class ClientService {
  constructor(private supabase: any) {}

  async createClientFromRemOnline(clientId: number) {
    try {
      console.log(`👤 ClientService.createClientFromRemOnline called for client ${clientId}`)

      // Fetch complete client details from RemOnline API
      const clientDetails = await remonline.getClientById(clientId)

      if (!clientDetails.success) {
        console.error("❌ Failed to fetch client details from RemOnline:", clientDetails.message)
        throw new Error(`Failed to fetch client details: ${clientDetails.message}`)
      }

      // Check if clientDetails.client exists before parsing
      if (!clientDetails.client) {
        console.error("❌ Client details are undefined")
        throw new Error("Client details are undefined")
      }

      const clientData = clientDetails.client
      console.log("👤 Client data:", JSON.stringify(clientData, null, 2))

      if (!clientData.email) {
        console.error("❌ Client from RemOnline has no email, cannot create user")
        throw new Error("Client has no email")
      }

      // Check if user already exists
      const { data: existingUser, error: selectError } = await this.supabase
        .from("users")
        .select("id")
        .eq("email", clientData.email.toLowerCase())
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("❌ Error checking existing user:", selectError)
        throw new Error(`Error checking existing user: ${selectError.message}`)
      }

      if (existingUser) {
        console.log(`👤 User already exists, updating instead`)
        return await this.updateExistingUser(existingUser.id, clientData)
      } else {
        return await this.createNewUser(clientData)
      }
    } catch (error) {
      console.error("💥 Error in createClientFromRemOnline:", error)
      throw error
    }
  }

  async updateClientFromRemOnline(clientId: number) {
    try {
      console.log(`👤 ClientService.updateClientFromRemOnline called for client ${clientId}`)

      // Fetch complete client details from RemOnline API
      const clientDetails = await remonline.getClientById(clientId)

      if (!clientDetails.success || !clientDetails.client) {
        console.error("❌ Failed to fetch client details from RemOnline:", clientDetails.message)
        throw new Error(`Failed to fetch client details: ${clientDetails.message}`)
      }

      const clientData = clientDetails.client

      if (!clientData.email) {
        console.error("❌ Client from RemOnline has no email, cannot update user")
        throw new Error("Client has no email")
      }

      // Find existing user
      const { data: existingUser, error: selectError } = await this.supabase
        .from("users")
        .select("id")
        .eq("remonline_id", clientId)
        .single()

      if (selectError || !existingUser) {
        console.log(`👤 User not found with remonline_id ${clientId}, creating new user`)
        return await this.createNewUser(clientData)
      }

      return await this.updateExistingUser(existingUser.id, clientData)
    } catch (error) {
      console.error("💥 Error in updateClientFromRemOnline:", error)
      throw error
    }
  }

  async deleteClient(clientId: number) {
    try {
      console.log(`🗑️ ClientService.deleteClient called for client ${clientId}`)

      // Find user by remonline_id
      const { data: user, error: userError } = await this.supabase
        .from("users")
        .select("id")
        .eq("remonline_id", clientId)
        .single()

      if (userError || !user) {
        console.log(`⚠️ No user found with remonline_id ${clientId}`)
        return
      }

      // Delete user's orders first
      await this.supabase.from("user_repair_orders").delete().eq("user_id", user.id)

      // Delete user's profile
      await this.supabase.from("profiles").delete().eq("id", user.id)

      // Delete user's sessions
      await this.supabase.from("sessions").delete().eq("user_id", user.id)

      // Finally delete the user
      const { error: deleteError } = await this.supabase.from("users").delete().eq("id", user.id)

      if (deleteError) {
        console.error("❌ Error deleting user:", deleteError)
        throw new Error(`Failed to delete user: ${deleteError.message}`)
      }

      console.log(`✅ Client ${clientId} deleted successfully`)
    } catch (error) {
      console.error("💥 Error in deleteClient:", error)
      throw error
    }
  }

  private async createNewUser(clientData: any) {
    try {
      // Extract client data
      const email = clientData.email?.toLowerCase()
      const firstName = clientData.first_name || ""
      const lastName = clientData.last_name || ""
      const phone = clientData.phone || null
      const address = clientData.address || null

      console.log(`👤 Creating new user:`)
      console.log(`   - Email: ${email}`)
      console.log(`   - Name: ${firstName} ${lastName}`)
      console.log(`   - RemOnline ID: ${clientData.id}`)

      // Generate a random password (user will use passwordless login anyway)
      const randomPassword = Math.random().toString(36).slice(-10)
      const passwordHash = await hash(randomPassword)

      // Create user in our database
      const { data: newUser, error: userError } = await this.supabase
        .from("users")
        .insert({
          email: email,
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`.trim(),
          password_hash: passwordHash,
          role: "user",
          remonline_id: clientData.id,
          email_verified: true, // Since it's coming from RemOnline, we can trust it
        })
        .select("id")
        .single()

      if (userError) {
        console.error("❌ Error creating user from RemOnline webhook:", userError)
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      console.log(`✅ User created with ID: ${newUser.id}`)

      // Create profile with email and address
      const profileData = {
        id: newUser.id,
        first_name: firstName,
        last_name: lastName,
        phone,
        email, // Add email to profiles
        address, // Add address to profiles
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await this.supabase.from("profiles").insert([profileData])

      if (profileError) {
        console.error("❌ Error creating profile:", profileError)
        // If profile creation fails, delete the user to maintain data integrity
        await this.supabase.from("users").delete().eq("id", newUser.id)
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      console.log(`✅ User created from RemOnline webhook: ${newUser.id}`)
      return newUser
    } catch (error) {
      console.error("💥 Error in createNewUser:", error)
      throw error
    }
  }

  private async updateExistingUser(userId: string, clientData: any) {
    try {
      // Extract client data
      const email = clientData.email?.toLowerCase()
      const firstName = clientData.first_name || ""
      const lastName = clientData.last_name || ""
      const phone = clientData.phone || null
      const address = clientData.address || ""

      console.log(`👤 Updating existing user ${userId}:`)
      console.log(`   - Email: ${email}`)
      console.log(`   - Name: ${firstName} ${lastName}`)
      console.log(`   - RemOnline ID: ${clientData.id}`)

      // Update user
      const { error: userError } = await this.supabase
        .from("users")
        .update({
          email, // Update email in users
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`.trim(),
          remonline_id: clientData.id, // Update remonline_id
        })
        .eq("id", userId)

      if (userError) {
        console.error("❌ Error updating user from RemOnline webhook:", userError)
        throw new Error(`Failed to update user: ${userError.message}`)
      }

      // Update profile
      const { error: profileError } = await this.supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          email, // Update email in profiles
          address, // Update address in profiles
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (profileError) {
        console.error("❌ Error updating profile from RemOnline webhook:", profileError)
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      console.log(`✅ User updated from RemOnline webhook: ${userId}`)

      // Clear all user sessions
      await clearUserSessionsByUserId(userId)

      return { id: userId }
    } catch (error) {
      console.error("💥 Error in updateExistingUser:", error)
      throw error
    }
  }
}
