import crypto from "crypto"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "./supabase"

// Hash password using PBKDF2
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex")

    // Use PBKDF2 to hash the password
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      // Format: iterations:salt:hash
      resolve(`10000:${salt}:${derivedKey.toString("hex")}`)
    })
  })
}

// Verify password against stored hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Extract the salt and iteration count from the stored hash
      const [iterations, salt, hash] = storedHash.split(":")
      const iterCount = Number.parseInt(iterations)

      // Hash the provided password with the same salt and iterations
      crypto.pbkdf2(password, salt, iterCount, 64, "sha512", (err, derivedKey) => {
        if (err) reject(err)
        // Compare the hashes
        resolve(derivedKey.toString("hex") === hash)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Generate a session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Set session cookie
export function setSessionCookie(sessionId: string): void {
  // Set cookie to expire in 7 days
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  cookies().set("session_id", sessionId, {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

// Clear session cookie
export function clearSessionCookie(): void {
  cookies().delete("session_id")
}

// Get current user from session
export async function getCurrentUser() {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  const supabase = createServerSupabaseClient()

  // Get session
  const { data: sessionData } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("id", sessionId)
    .single()

  if (!sessionData || new Date(sessionData.expires_at) < new Date()) {
    // Session expired or not found
    clearSessionCookie()
    return null
  }

  // Get user
  const { data: userData } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", sessionData.user_id)
    .single()

  if (!userData) {
    clearSessionCookie()
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
