import { hash } from "@/lib/auth/utils"
import { clearUserSessionsByUserId } from "@/app/actions/session"

export class ClientService {
  constructor(private supabase: any) {}

  async createUserFromClient(clientData: any) {
    try {
      // Extract client data
      const email = clientData.email?.toLowerCase()
      const firstName = clientData.first_name || ""
      const lastName = clientData.last_name || ""
      const phone = clientData.phone || null
      const address = clientData.address || null

      if (!email) {
        throw new Error("Client from RemOnline has no email, cannot create user")
      }

      // Check if user already exists
      const { data: existingUser } = await this.supabase.from("users").select("id").eq("email", email).single()

      if (existingUser) {
        console.log(`User with email ${email} already exists, updating instead`)
        return await this.updateUserFromClient(clientData)
      }

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
        console.error("Error creating user from RemOnline webhook:", userError)
        throw new Error(`Failed to create user: ${userError.message}`)
      }

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
        console.error("Error creating profile:", profileError)
        // If profile creation fails, delete the user to maintain data integrity
        await this.supabase.from("users").delete().eq("id", newUser.id)
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }

      console.log(`User created from RemOnline webhook: ${newUser.id}`)
      return newUser
    } catch (error) {
      console.error("Error in createUserFromClient:", error)
      throw error
    }
  }

  async updateUserFromClient(clientData: any) {
    try {
      // Extract client data
      const email = clientData.email?.toLowerCase()
      const firstName = clientData.first_name || ""
      const lastName = clientData.last_name || ""
      const phone = clientData.phone || null
      const address = clientData.address || ""

      if (!email) {
        throw new Error("Client from RemOnline has no email, cannot update user")
      }

      // Find user by email or remonline_id
      const { data: existingUser, error: selectError } = await this.supabase
        .from("users")
        .select("id")
        .or(`email.eq.${email},remonline_id.eq.${clientData.id}`)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        console.error("Error finding existing user:", selectError)
        throw new Error(`Failed to find user: ${selectError.message}`)
      }

      if (!existingUser) {
        console.log(`No user found for client ${clientData.id}, creating new one`)
        return await this.createUserFromClient(clientData)
      }

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
        .eq("id", existingUser.id)

      if (userError) {
        console.error("Error updating user from RemOnline webhook:", userError)
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
        .eq("id", existingUser.id)

      if (profileError) {
        console.error("Error updating profile from RemOnline webhook:", profileError)
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      console.log(`User updated from RemOnline webhook: ${existingUser.id}`)

      // Clear all user sessions
      await clearUserSessionsByUserId(existingUser.id)

      return existingUser
    } catch (error) {
      console.error("Error in updateUserFromClient:", error)
      throw error
    }
  }

  async handleClientDeletion(clientId: number) {
    try {
      console.log(`Handling deletion of client ${clientId}`)

      // Find user by remonline_id
      const { data: user } = await this.supabase.from("users").select("id").eq("remonline_id", clientId).single()

      if (!user) {
        console.log(`No user found with remonline_id ${clientId}`)
        return
      }

      // Instead of deleting the user, we might want to:
      // 1. Mark as deleted/inactive
      // 2. Clear remonline_id
      // 3. Keep historical data

      const { error: updateError } = await this.supabase
        .from("users")
        .update({
          remonline_id: null, // Clear the connection to RemOnline
          // You might want to add a 'deleted_at' field or 'is_active' flag
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error handling client deletion:", updateError)
        throw new Error(`Failed to handle client deletion: ${updateError.message}`)
      }

      // Clear all user sessions
      await clearUserSessionsByUserId(user.id)

      console.log(`Client deletion handled for user ${user.id}`)
    } catch (error) {
      console.error("Error in handleClientDeletion:", error)
      throw error
    }
  }
}
