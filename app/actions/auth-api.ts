"use server"

import { createClient } from "@/utils/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode as verifyCodeLib,
} from "@/lib/auth/verification-code"
import { sendVerificationCode as sendVerificationCodeEmail } from "@/lib/email/send-email"
import { syncClientToRemonline, updateRemonlineIdForUser } from "@/lib/services/remonline-sync"

// Check if user exists in Supabase Auth
export async function checkUserExists(email: string): Promise<{
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
    console.log(`Checking if user exists with email: ${email}`)

    const supabase = createServiceClient()

    // Check if user exists in auth.users
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()

    if (error) {
      console.error("Error checking users:", error)
      return {
        success: false,
        message: "Error checking user. Please try again later.",
      }
    }

    const existingUser = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", existingUser.id)
        .single()

      const name = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : existingUser.user_metadata?.full_name || existingUser.email

      return {
        success: true,
        userData: {
          id: existingUser.id,
          email: existingUser.email!,
          name,
          phone: profile?.phone,
        },
      }
    }

    return {
      success: false,
      message: "User not found",
    }
  } catch (error) {
    console.error("Check user error:", error)
    return {
      success: false,
      message: "Failed to check if user exists. Please try again later.",
    }
  }
}

// Send verification code
export async function sendVerificationCode(
  email: string,
  type: "login" | "registration",
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Sending verification code for ${type} to email: ${email}`)

    // Generate verification code
    const code = generateVerificationCode()
    console.log(`Generated code: ${code}`)

    // Save code to database
    const saved = await saveVerificationCode(email, code, type)
    if (!saved) {
      console.error("Failed to save verification code to database")
      return {
        success: false,
        message: "Failed to generate verification code",
      }
    }

    // Send email with code
    try {
      await sendVerificationCodeEmail(email, code, "uk", type === "login")
      console.log(`Verification code sent to ${email}`)
      return { success: true }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      return {
        success: false,
        message: "Failed to send verification email",
      }
    }
  } catch (error) {
    console.error("Send verification code error:", error)
    return {
      success: false,
      message: "Failed to send verification code. Please try again later.",
    }
  }
}

// Verify code and sign in/up user
export async function verifyCode(
  email: string,
  code: string,
  type: "login" | "registration",
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Verifying code for ${email}: ${code}`)

    // Verify code
    const verification = await verifyCodeLib(email, code, type)
    if (!verification.valid) {
      console.error("Invalid verification code:", verification.message)
      return {
        success: false,
        message: verification.message || "Invalid verification code",
      }
    }

    console.log("Code verified successfully")

    const supabase = createClient()

    if (type === "login") {
      // Sign in existing user
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) {
        console.error("Error signing in user:", error)
        return {
          success: false,
          message: "Failed to sign in user",
        }
      }
    } else {
      // Sign up new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36), // Random password, won't be used
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        },
      })

      if (error) {
        console.error("Error signing up user:", error)
        return {
          success: false,
          message: "Failed to create user account",
        }
      }

      // Create profile if user was created
      if (data.user) {
        const serviceSupabase = createServiceClient()

        // Confirm the user's email since we verified it with our code
        await serviceSupabase.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        })

        const { error: profileError } = await serviceSupabase.from("profiles").insert({
          id: data.user.id,
          first_name: "",
          last_name: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Failed to create profile:", profileError)
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Verify code error:", error)
    return {
      success: false,
      message: "Failed to verify code. Please try again later.",
    }
  }
}

// Create user profile after registration
export async function createUserProfile(userData: {
  first_name: string
  last_name: string
  phone?: string
  address?: string
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      }
    }

    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || null,
        address: userData.address || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("Failed to update profile:", error)
      return {
        success: false,
        message: "Failed to update profile",
      }
    }

    // Sync with RemOnline in the background
    if (userData.first_name && userData.last_name) {
      syncClientToRemonline({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: user.email!,
        phone: userData.phone ? [userData.phone] : [],
        address: userData.address,
      })
        .then((result) => {
          if (result.success && result.remonlineId) {
            updateRemonlineIdForUser(user.id, result.remonlineId)
          }
        })
        .catch((error) => {
          console.error("Error syncing with RemOnline:", error)
        })
    }

    return { success: true }
  } catch (error) {
    console.error("Create user profile error:", error)
    return {
      success: false,
      message: "Failed to create user profile. Please try again later.",
    }
  }
}

// Sign out user
export async function signOut() {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return { success: false, message: "Failed to sign out" }
    }

    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, message: "Failed to sign out" }
  }
}

// Sign out with redirect
export async function signOutWithRedirect(locale: string) {
  const result = await signOut()

  if (result.success) {
    redirect(`/${locale}`)
  }

  return result
}
