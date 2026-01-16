"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { hash, verifyPassword } from "@/utils/auth"
import { revalidatePath } from "next/cache"

// Create a Supabase client for server-side operations
function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

function setSecureCookie(name: string, value: string, maxAge: number = 30 * 24 * 60 * 60) {
  const isProduction = process.env.NODE_ENV === "production"

  cookies().set(name, value, {
    httpOnly: true,
    secure: isProduction,
    maxAge,
    path: "/",
    sameSite: "lax", // Changed from "strict"
  })
}

// Validate password strength
function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" }
  }
  return { valid: true }
}

// Register a new user
export async function register(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null

  // Validate inputs
  if (!email || !password || !name) {
    return { success: false, message: "All fields are required" }
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { success: false, message: passwordValidation.message }
  }

  try {
    const supabase = createServerClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      return { success: false, message: "Email is already registered" }
    }

    // Hash password
    const passwordHash = await hash(password)

    // Insert user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ email: email.toLowerCase(), password_hash: passwordHash, role: "user" }])
      .select("id")
      .single()

    if (userError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating user:", userError)
      }
      return { success: false, message: "Failed to create user account" }
    }

    // Check if profiles table has a phone column
    const { data: profileColumns, error: columnsError } = await supabase.from("profiles").select("*").limit(1)

    if (columnsError && process.env.NODE_ENV === "development") {
      console.error("Error checking profile columns:", columnsError)
    }

    // Determine if we should include phone in the profile
    const hasPhoneColumn = profileColumns && Object.keys(profileColumns[0] || {}).includes("phone")

    // Insert profile with or without phone based on schema
    const profileData = hasPhoneColumn
      ? {
          id: userData.id,
          name,
          phone,
          avatar_url: `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(name)}`,
        }
      : {
          id: userData.id,
          name,
          avatar_url: `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(name)}`,
        }

    const { error: profileError } = await supabase.from("profiles").insert([profileData])

    if (profileError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating profile:", profileError)
      }
      // Delete user if profile creation fails
      await supabase.from("users").delete().eq("id", userData.id)
      return { success: false, message: "Failed to create user profile" }
    }

    // Create a session
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
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating session:", sessionError)
      }
      return { success: false, message: "Failed to create session" }
    }

    setSecureCookie("session_id", session.id)
    setSecureCookie("user_role", "user")

    revalidatePath("/", "layout")

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Registration error:", error)
    }
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Login user
export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate inputs
  if (!email || !password) {
    return { success: false, message: "Email and password are required" }
  }

  try {
    const supabase = createServerClient()

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
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating session:", sessionError)
      }
      return { success: false, message: "loginFailed" }
    }

    setSecureCookie("session_id", session.id)
    setSecureCookie("user_role", userData.role || "user")

    revalidatePath("/", "layout")

    return { success: true, role: userData.role }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Login error:", error)
    }
    return { success: false, message: "unexpectedError" }
  }
}

// Logout user
export async function logout() {
  const sessionId = cookies().get("session_id")?.value

  if (sessionId) {
    // Delete the session from the database
    const supabase = createServerClient()
    await supabase.from("sessions").delete().eq("id", sessionId)
  }

  cookies().delete("session_id")
  cookies().delete("user_role")

  revalidatePath("/", "layout")

  return { success: true }
}

// Login with redirect
export async function loginWithRedirect(formData: FormData, locale: string) {
  const result = await login(formData)

  if (result.success) {
    // Redirect based on role
    if (result.role === "admin") {
      redirect(`/${locale}/admin`)
    } else {
      redirect(`/${locale}/profile`)
    }
  }

  return result
}

// Register with redirect
export async function registerWithRedirect(formData: FormData, locale: string) {
  try {
    const result = await register(formData)

    if (result.success) {
      // Redirect to home page after successful registration
      redirect(`/${locale}`)
    }

    return result
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Registration redirect error:", error)
    }
    return { success: false, message: "An unexpected error occurred during registration" }
  }
}
