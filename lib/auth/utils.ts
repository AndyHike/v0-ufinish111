import crypto from "crypto"
import { cookies } from "next/headers"

// Generate a salt
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString("hex")
}

// Hash a password with PBKDF2
export async function hash(password: string): Promise<string> {
  const salt = generateSalt()
  const iterations = 10000
  const keylen = 64
  const digest = "sha512"

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err)
      // Format: iterations:salt:hash
      resolve(`${iterations}:${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

// Adding the hashPassword function as an alias to hash for compatibility
export const hashPassword = hash

// Verify a password against a hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [iterations, salt, hash] = storedHash.split(":")
    const keylen = 64
    const digest = "sha512"

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, Number.parseInt(iterations), keylen, digest, (err, derivedKey) => {
        if (err) reject(err)
        resolve(derivedKey.toString("hex") === hash)
      })
    })
  } catch (error) {
    console.error("Error verifying password:", error)
    return false
  }
}

// Get current user from session
export async function getCurrentUser(supabase: any) {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  // Get session
  const { data: sessionData } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("id", sessionId)
    .single()

  if (!sessionData || new Date(sessionData.expires_at) < new Date()) {
    // Session expired or not found
    cookies().delete("session_id")
    return null
  }

  // Get user
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", sessionData.user_id)
    .single()

  if (!userData) {
    cookies().delete("session_id")
    return null
  }

  // Get profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("name, phone, avatar_url")
    .eq("id", userData.id)
    .single()

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: profileData?.name || null,
    phone: profileData?.phone || null,
    avatar_url: profileData?.avatar_url || null,
  }
}
