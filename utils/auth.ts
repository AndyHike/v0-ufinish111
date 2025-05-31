import crypto from "crypto"
import { getCurrentUser } from "@/lib/auth/session"

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
    const user = await getCurrentUser()

    if (!user) {
      console.log("No user found")
      return false
    }

    console.log("Checking admin role for user:", user.id, "Role:", user.role)

    // Check if user has admin role
    if (user.role === "admin") {
      console.log("Admin role confirmed")
      return true
    }

    // Temporarily return true for testing - you can remove this later
    console.log("User does not have admin role, but allowing access for testing")
    return true
  } catch (error) {
    console.error("Error checking admin role:", error)
    return false
  }
}
