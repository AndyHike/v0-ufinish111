"use server"

import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// Нова система авторизації через Supabase Auth

export async function signInWithEmail(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Тільки для існуючих користувачів
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: "Check your email for the login code" }
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const phone = formData.get("phone") as string

  if (!email || !firstName || !lastName) {
    return { success: false, message: "All fields are required" }
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password: Math.random().toString(36), // Тимчасовий пароль
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: "Check your email to confirm your account" }
}

export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function signOutAndRedirect(locale: string) {
  await signOut()
  redirect(`/${locale}`)
}

export async function getCurrentUser() {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Отримуємо профіль та роль користувача
    const [profileResult, roleResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("user_roles").select("role").eq("id", user.id).single(),
    ])

    return {
      id: user.id,
      email: user.email!,
      role: roleResult.data?.role || "user",
      profile: profileResult.data || null,
      emailConfirmed: user.email_confirmed_at !== null,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function isUserAdmin() {
  const user = await getCurrentUser()
  return user?.role === "admin"
}
