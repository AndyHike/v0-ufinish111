import { createClient } from "@/utils/supabase/server"
import { createSupabaseClient } from "@/utils/supabase/client"

// Серверні функції авторизації
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
      ...user,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function isUserAdmin(userId?: string) {
  const supabase = createClient()

  try {
    let targetUserId = userId

    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return false
      targetUserId = user.id
    }

    const { data, error } = await supabase.from("user_roles").select("role").eq("id", targetUserId).single()

    if (error || !data) {
      return false
    }

    return data.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Клієнтські функції авторизації
export async function signInWithEmail(email: string) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Тільки для існуючих користувачів
    },
  })

  return { data, error }
}

export async function signUpWithEmail(
  email: string,
  userData: {
    first_name: string
    last_name: string
    phone?: string
  },
) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password: Math.random().toString(36), // Тимчасовий пароль, не використовується
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
      },
    },
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createSupabaseClient()

  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function updateProfile(
  userId: string,
  profileData: {
    first_name?: string
    last_name?: string
    phone?: string
    address?: string
    remonline_id?: string
  },
) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

  return { data, error }
}
