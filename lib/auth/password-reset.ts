import { createServerSupabaseClient } from "@/lib/supabase"
import { randomBytes } from "crypto"

// Generate a password reset token
export async function generatePasswordResetToken(userId: string): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to generate a password reset token")
  }

  const supabase = createServerSupabaseClient()

  // Generate a random token
  const token = randomBytes(32).toString("hex")

  // Set expiration time (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  try {
    // Delete any existing tokens for this user
    await supabase.from("password_reset_tokens").delete().eq("user_id", userId)

    // Insert the new token
    const { error } = await supabase.from("password_reset_tokens").insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (error) {
      console.error("Error generating password reset token:", error)
      throw new Error(`Failed to generate password reset token: ${error.message}`)
    }

    return token
  } catch (error) {
    console.error("Error in generatePasswordResetToken:", error)
    throw error
  }
}

// Verify a password reset token
export async function verifyPasswordResetToken(
  token: string,
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const supabase = createServerSupabaseClient()

  try {
    // Get the token
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .single()

    if (error || !data) {
      return { valid: false, error: "Invalid token" }
    }

    // Check if token is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return { valid: false, error: "Token expired" }
    }

    return { valid: true, userId: data.user_id }
  } catch (error) {
    console.error("Error in verifyPasswordResetToken:", error)
    return { valid: false, error: "An unexpected error occurred" }
  }
}
