import crypto from "crypto"
import { createServerSupabaseClient } from "@/lib/supabase"

// Generate a random token
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Create a verification token for a user
export async function createVerificationToken(userId: string): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient()
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing tokens for this user
    await supabase.from("email_verification_tokens").delete().eq("user_id", userId)

    // Create a new token
    const { error } = await supabase.from("email_verification_tokens").insert([
      {
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      },
    ])

    if (error) {
      console.error("Error creating verification token:", error)
      return null
    }

    return token
  } catch (error) {
    console.error("Error in createVerificationToken:", error)
    return null
  }
}

// Adding the generateEmailVerificationToken function as an alias to createVerificationToken for compatibility
export const generateEmailVerificationToken = createVerificationToken

// Verify a token and mark the user as verified
export async function verifyEmailToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const supabase = createServerSupabaseClient()

    // Get the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("id, user_id, expires_at")
      .eq("token", token)
      .single()

    if (tokenError || !tokenData) {
      console.error("Token not found or error:", tokenError)
      return { valid: false, error: "Invalid token" }
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error("Token expired")
      return { valid: false, error: "Token expired" }
    }

    // Delete the token
    await supabase.from("email_verification_tokens").delete().eq("id", tokenData.id)

    return { valid: true, userId: tokenData.user_id }
  } catch (error) {
    console.error("Error in verifyEmailToken:", error)
    return { valid: false, error: "An unexpected error occurred" }
  }
}
