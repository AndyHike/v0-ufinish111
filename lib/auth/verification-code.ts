import { createClient } from "@/lib/supabase"

// Generate a random 6-digit code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Save verification code to database
export async function saveVerificationCode(
  email: string,
  code: string,
  type: "login" | "registration",
  userId?: string,
): Promise<boolean> {
  const supabase = createClient()

  // Set expiration time (15 minutes from now)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 15)

  // Delete any existing codes for this email and type
  await supabase.from("verification_codes").delete().eq("email", email).eq("type", type)

  // Insert new code
  const { error } = await supabase.from("verification_codes").insert({
    user_id: userId,
    email,
    code,
    type,
    expires_at: expiresAt.toISOString(),
  })

  return !error
}

// Verify code
export async function verifyCode(
  email: string,
  code: string,
  type: "login" | "registration",
): Promise<{ valid: boolean; userId?: string; message?: string }> {
  const supabase = createClient()

  // Get code from database
  const { data, error } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .eq("type", type)
    .single()

  if (error || !data) {
    return { valid: false, message: "Invalid verification code" }
  }

  // Check if code is expired
  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) {
    return { valid: false, message: "Verification code has expired" }
  }

  // Delete the code after successful verification
  await supabase.from("verification_codes").delete().eq("id", data.id)

  return { valid: true, userId: data.user_id }
}
