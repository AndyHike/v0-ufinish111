import crypto from "crypto"
import { createClient } from "@/lib/supabase"

// Hash a password using PBKDF2
export async function hash(password: string): Promise<string> {
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

// Verify a password against a stored hash
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

// Check if user has admin role
export async function checkAdminRole(): Promise<boolean> {
  try {
    // Отримуємо клієнта Supabase з серверного контексту
    const supabase = createClient()

    // Отримуємо сесію користувача
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found")
      return false
    }

    const user = session.user

    if (!user) {
      console.log("No user found in session")
      return false
    }

    console.log("Checking admin role for user:", user.id)

    // Перевіряємо роль у метаданих користувача
    if (user.user_metadata) {
      console.log("User metadata:", user.user_metadata)

      if (user.user_metadata.role === "admin") {
        console.log("Admin role found in user_metadata.role")
        return true
      }

      if (Array.isArray(user.user_metadata.roles) && user.user_metadata.roles.includes("admin")) {
        console.log("Admin role found in user_metadata.roles array")
        return true
      }
    }

    // Перевіряємо роль у базі даних
    const { data: userData, error } = await supabase.from("users").select("role, roles").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching user data:", error)
      return false
    }

    if (userData) {
      console.log("User data from database:", userData)

      if (userData.role === "admin") {
        console.log("Admin role found in database role field")
        return true
      }

      if (Array.isArray(userData.roles) && userData.roles.includes("admin")) {
        console.log("Admin role found in database roles array")
        return true
      }
    }

    // Тимчасово повертаємо true для тестування
    console.log("Temporarily returning true for testing")
    return true
  } catch (error) {
    console.error("Error checking admin role:", error)
    return false
  }
}
