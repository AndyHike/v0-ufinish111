"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { generatePasswordResetToken, verifyPasswordResetToken } from "@/lib/auth/password-reset"
import { sendPasswordResetEmail as sendPasswordResetEmailLib } from "@/lib/email/send-email"
import { createVerificationToken } from "@/lib/auth/token"
import { sendVerificationEmail as sendVerificationEmailLib } from "@/lib/email/send-email"
import { hashPassword } from "@/lib/auth/utils"

export async function logout() {
  cookies().delete("session_id")
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
