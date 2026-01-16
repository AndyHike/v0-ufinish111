"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode as verifyCodeLib,
} from "@/lib/auth/verification-code"
import { sendVerificationCode as sendVerificationCodeEmail } from "@/lib/email/send-email"
import { syncClientToRemonline, updateRemonlineIdForUser } from "@/lib/services/remonline-sync"
import { hash } from "@/lib/auth/utils"
import { revalidatePath } from "next/cache"

function setSecureCookie(name: string, value: string, maxAge: number = 30 * 24 * 60 * 60) {
  const isProduction = process.env.NODE_ENV === "production"

  cookies().set(name, value, {
    httpOnly: true,
    secure: isProduction,
    maxAge,
    path: "/",
    sameSite: "lax", // Changed from "strict" to "lax" for better cross-origin support
  })

  if (process.env.NODE_ENV === "development") {
    console.log(`[v0] Cookie set: ${name}=${value}, secure=${isProduction}, sameSite=lax`)
  }
}

// Check if user exists in our database
export async function checkUserExists(identifier: string): Promise<{
  success: boolean
  message?: string
  userData?: {
    id: string
    email: string
    name: string
    phone?: string
  }
}> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`Checking if user exists with identifier: ${identifier}`)
    }

    const supabase = createClient()

    // Determine if identifier is email or phone
    const isEmail = identifier.includes("@")

    let userData

    if (isEmail) {
      // Search by email
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, 
          email, 
          first_name,
          last_name,
          profiles!inner(phone)
        `)
        .eq("email", identifier.toLowerCase())
        .maybeSingle()

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking user by email:", error)
        }
        return {
          success: false,
          message: "Error checking user. Please try again later.",
        }
      }

      userData = data
    } else {
      // Search by phone
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          phone,
          email,
          first_name,
          last_name,
          users!inner(id, email, first_name, last_name)
        `)
        .eq("phone", identifier)
        .maybeSingle()

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking user by phone:", error)
        }
        return {
          success: false,
          message: "Error checking user. Please try again later.",
        }
      }

      if (data) {
        userData = {
          id: data.users.id,
          email: data.users.email,
          name: `${data.users.first_name} ${data.users.last_name}`.trim(),
          phone: data.phone,
        }
      }
    }

    if (userData) {
      return {
        success: true,
        userData: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
        },
      }
    }

    return {
      success: false,
      message: "User not found",
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Check user error:", error)
    }
    return {
      success: false,
      message: "Failed to check if user exists. Please try again later.",
    }
  }
}

// Send verification code
export async function sendVerificationCode(
  identifier: string,
  type: "login" | "registration",
): Promise<{ success: boolean; message?: string; email?: string }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending verification code for ${type} to identifier: ${identifier}`)
    }

    // If identifier is an email, use it directly
    // If it's a phone number, we need to find the associated email
    let email = identifier

    if (!identifier.includes("@")) {
      // It's a phone number, find the associated email
      const userResult = await checkUserExists(identifier)
      if (!userResult.success || !userResult.userData) {
        return {
          success: false,
          message: "Could not find a user with this phone number",
        }
      }

      email = userResult.userData.email
    }

    // Generate verification code
    const code = generateVerificationCode()
    if (process.env.NODE_ENV === "development") {
      console.log(`Generated code: ${code}`)
    }

    // Save code to database
    const saved = await saveVerificationCode(email, code, type)
    if (!saved) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to save verification code to database")
      }
      return {
        success: false,
        message: "Failed to generate verification code",
      }
    }

    // Send email with code
    try {
      await sendVerificationCodeEmail(email, code, "uk", type === "login")
      if (process.env.NODE_ENV === "development") {
        console.log(`Verification code sent to ${email}`)
      }
      return { success: true, email }
    } catch (emailError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to send verification email:", emailError)
      }
      return {
        success: false,
        message: "Failed to send verification email",
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Send verification code error:", error)
    }
    return {
      success: false,
      message: "Failed to send verification code. Please try again later.",
    }
  }
}

// Verify code and create session
export async function verifyCode(
  identifier: string,
  code: string,
  type: "login" | "registration",
): Promise<{ success: boolean; message?: string }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[v0] Verifying code for ${identifier}: ${code}`)
    }

    // If identifier is a phone number, we need to find the associated email
    let email = identifier
    let userId = null
    let userRole = "user"

    if (!identifier.includes("@")) {
      // It's a phone number, find the associated email
      const userResult = await checkUserExists(identifier)
      if (!userResult.success || !userResult.userData) {
        return {
          success: false,
          message: "Could not find a user with this phone number",
        }
      }

      email = userResult.userData.email
      userId = userResult.userData.id
    } else {
      // It's an email, get the user ID
      const userResult = await checkUserExists(identifier)
      if (userResult.success && userResult.userData) {
        userId = userResult.userData.id
      }
    }

    // Verify code
    const verification = await verifyCodeLib(email, code, type)
    if (!verification.valid) {
      if (process.env.NODE_ENV === "development") {
        console.error("[v0] Invalid verification code:", verification.message)
      }
      return {
        success: false,
        message: verification.message || "Invalid verification code",
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[v0] Code verified successfully for email: ${email}`)
    }

    if (type === "login") {
      // For login, create session
      const supabase = createClient()

      // If we don't have a userId yet, get it from the database
      if (!userId) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, role")
          .eq("email", email.toLowerCase())
          .maybeSingle()

        if (!userData) {
          return {
            success: false,
            message: "User not found",
          }
        }

        userId = userData.id
        userRole = userData.role || "user"
      } else {
        // Get user role
        const { data: userData } = await supabase.from("users").select("role").eq("id", userId).maybeSingle()

        if (userData) {
          userRole = userData.role || "user"
        }
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert([
          {
            user_id: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
        ])
        .select("id")
        .single()

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[v0] Failed to create session:", sessionError)
        }
        return {
          success: false,
          message: "Failed to create session",
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[v0] Session created: ${session.id}, setting cookies...`)
      }

      setSecureCookie("session_id", session.id)
      setSecureCookie("user_role", userRole)

      if (process.env.NODE_ENV === "development") {
        console.log(`[v0] Cookies set successfully for user ${userId}`)
      }

      revalidatePath("/", "layout")
    }

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Verify code error:", error)
    }
    return {
      success: false,
      message: "Failed to verify code. Please try again later.",
    }
  }
}

// Create user in our database and sync with RemOnline in the background
export async function createUser(userData: {
  first_name: string
  last_name: string
  email: string
  phone: string[]
  address?: string
}): Promise<{ success: boolean; message?: string }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("Creating user in database:", userData)
    }

    const supabase = createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      if (process.env.NODE_ENV === "development") {
        console.log("User already exists in database:", existingUser)
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert([
          {
            user_id: existingUser.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select("id")
        .single()

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to create session:", sessionError)
        }
        return {
          success: false,
          message: "Failed to create session",
        }
      }

      setSecureCookie("session_id", session.id)

      // Sync with RemOnline in the background
      syncClientToRemonline(userData)
        .then((result) => {
          if (result.success && result.remonlineId) {
            updateRemonlineIdForUser(existingUser.id, result.remonlineId)
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Error syncing with RemOnline:", error)
          }
        })

      return { success: true }
    }

    // Generate a random password (user will use passwordless login anyway)
    const randomPassword = Math.random().toString(36).slice(-10)
    const passwordHash = await hash(randomPassword)

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: userData.email.toLowerCase(),
        role: "user",
        first_name: userData.first_name,
        last_name: userData.last_name,
        password_hash: passwordHash,
        email_verified: true,
      })
      .select("id")
      .single()

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create user in database:", error)
      }
      return {
        success: false,
        message: "Failed to create user account",
      }
    }

    // Create profile with email
    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone[0] || null,
      email: userData.email.toLowerCase(),
      address: userData.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create profile in database:", profileError)
      }
      await supabase.from("users").delete().eq("id", newUser.id)
      return {
        success: false,
        message: "Failed to create user profile",
      }
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: newUser.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select("id")
      .single()

    if (sessionError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create session:", sessionError)
      }
      return {
        success: false,
        message: "Failed to create session",
      }
    }

    setSecureCookie("session_id", session.id)

    // Sync with RemOnline in the background
    syncClientToRemonline({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
    })
      .then((result) => {
        if (result.success && result.remonlineId) {
          updateRemonlineIdForUser(newUser.id, result.remonlineId)
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error syncing with RemOnline:", error)
        }
      })

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Create user error:", error)
    }
    return {
      success: false,
      message: "Failed to create user. Please try again later.",
    }
  }
}
