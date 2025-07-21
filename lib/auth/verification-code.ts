import { createClient } from "@/lib/supabase"

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function saveVerificationCode(
  email: string,
  code: string,
  type: "login" | "registration",
): Promise<boolean> {
  try {
    const supabase = createClient()

    // Delete any existing codes for this email and type
    await supabase.from("verification_codes").delete().eq("email", email.toLowerCase()).eq("type", type)

    // Insert new code
    const { error } = await supabase.from("verification_codes").insert({
      email: email.toLowerCase(),
      code,
      type,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })

    if (error) {
      console.error("Error saving verification code:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in saveVerificationCode:", error)
    return false
  }
}

export async function verifyCode(
  email: string,
  code: string,
  type: "login" | "registration",
): Promise<{ valid: boolean; message?: string }> {
  try {
    const supabase = createClient()

    // Find the code
    const { data: verificationCode, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("type", type)
      .eq("used", false)
      .single()

    if (error || !verificationCode) {
      return { valid: false, message: "Invalid verification code" }
    }

    // Check if code is expired
    if (new Date(verificationCode.expires_at) < new Date()) {
      return { valid: false, message: "Verification code has expired" }
    }

    // Mark code as used
    await supabase.from("verification_codes").update({ used: true }).eq("id", verificationCode.id)

    return { valid: true }
  } catch (error) {
    console.error("Error in verifyCode:", error)
    return { valid: false, message: "Error verifying code" }
  }
}
