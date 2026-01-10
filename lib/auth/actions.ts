"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { generatePasswordResetToken, verifyPasswordResetToken } from "@/lib/auth/password-reset"
import { sendPasswordResetEmail as sendPasswordResetEmailLib } from "@/lib/email/send-email"
import { createVerificationToken } from "@/lib/auth/token"
import { sendVerificationEmail as sendVerificationEmailLib } from "@/lib/email/send-email"
import { hashPassword } from "@/lib/auth/utils"
import { generateVerificationCode, saveVerificationCode, verifyCode } from "./verification-code"
import { sendVerificationCode as sendEmailVerificationCode } from "@/lib/email/send-email"
import { getLocale } from "@/lib/get-locale"
import { verifyPassword } from "@/lib/auth/utils" // Import verifyPassword

export async function logout() {
  cookies().delete("session_id")
  cookies().delete("user_role")
  return { success: true }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate inputs
  if (!email || !password) {
    return { success: false, message: "invalidCredentials" }
  }

  try {
    const supabase = createClient()

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, password_hash, role")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (userError || !userData) {
      return { success: false, message: "invalidCredentials" }
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, userData.password_hash)

    if (!isPasswordValid) {
      return { success: false, message: "invalidCredentials" }
    }

    // Generate session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: userData.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      ])
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return { success: false, message: "loginFailed" }
    }

    // Set session cookie
    cookies().set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    cookies().set("user_role", userData.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return { success: true, role: userData.role }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, message: "unexpectedError" }
  }
}

export async function sendPasswordResetEmail(email: string, locale: string) {
  try {
    const supabase = createClient()

    // Get user
    const { data: userData } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).single()

    if (!userData) {
      return { success: false, message: "User not found" }
    }

    // Generate password reset token
    const token = await generatePasswordResetToken(userData.id)

    if (!token) {
      return { success: false, message: "Failed to generate reset token" }
    }

    // Send password reset email
    await sendPasswordResetEmailLib(email, token, locale)

    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, message: "Failed to send password reset email" }
  }
}

export async function resendVerificationEmail(userId: string, locale: string) {
  try {
    const supabase = createClient()

    // Get user
    const { data: userData } = await supabase.from("users").select("email").eq("id", userId).single()

    if (!userData) {
      return { success: false, message: "User not found" }
    }

    // Generate verification token
    const token = await createVerificationToken(userId)

    if (!token) {
      return { success: false, message: "Failed to generate verification token" }
    }

    // Send verification email
    await sendVerificationEmailLib(userData.email, token, locale)

    return { success: true }
  } catch (error) {
    console.error("Error resending verification email:", error)
    return { success: false, message: "Failed to resend verification email" }
  }
}

export async function resetPassword(token: string, password: string) {
  try {
    const supabase = createClient()

    // Verify token
    const { valid, userId } = await verifyPasswordResetToken(token)

    if (!valid || !userId) {
      return { success: false, message: "Invalid or expired token" }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Update password
    const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", userId)

    if (error) {
      console.error("Error resetting password:", error)
      return { success: false, message: "Failed to reset password" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in resetPassword:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Send verification code for login or registration
export async function sendVerificationCode(email: string, isLogin = false) {
  if (!email) {
    return { success: false, message: "Email is required" }
  }

  try {
    const supabase = createClient()
    const locale = getLocale()

    // For login, check if the user exists
    if (isLogin) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      if (userError) {
        console.error("Error checking user:", userError)
        return { success: false, message: "An error occurred" }
      }

      if (!user) {
        return { success: false, message: "User not found" }
      }
    }

    // Generate and save verification code
    const code = generateVerificationCode()
    const type = isLogin ? "login" : "registration"
    const saved = await saveVerificationCode(email.toLowerCase(), code, type)

    if (!saved) {
      return { success: false, message: "Failed to save verification code" }
    }

    // Send verification code via email
    const sent = await sendEmailVerificationCode(email, code, locale, isLogin)

    if (!sent) {
      return { success: false, message: "Failed to send verification code" }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending verification code:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Verify login code and create session
export async function verifyLoginCode(email: string, code: string) {
  if (!email || !code) {
    return { success: false, message: "Email and verification code are required" }
  }

  try {
    // Verify the code
    const verification = await verifyCode(email.toLowerCase(), code, "login")

    if (!verification.valid) {
      return { success: false, message: verification.message || "Invalid verification code" }
    }

    const supabase = createClient()

    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (userError || !userData) {
      return { success: false, message: "User not found" }
    }

    // Generate session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: userData.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        },
      ])
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return { success: false, message: "Failed to create session" }
    }

    // Set session cookie
    cookies().set("session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    cookies().set("user_role", userData.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    })

    return { success: true, role: userData.role }
  } catch (error) {
    console.error("Error verifying login code:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
