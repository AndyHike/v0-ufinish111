import { createClient } from "@/utils/supabase/server"
import type { User } from "@supabase/supabase-js"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()

  try {
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return profile
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function getSession() {
  const supabase = createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    return session
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}

// Get user with profile data
export async function getUserWithProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const profile = await getUserProfile(user.id)

  return {
    ...user,
    profile,
  }
}

// Alias exports for backwards-compatibility
export { getCurrentUser as getUser }
