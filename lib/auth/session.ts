import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"

export async function getCurrentUser() {
  const sessionId = cookies().get("session_id")?.value

  if (!sessionId) {
    return null
  }

  const supabase = createClient()

  // Get session
  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("id", sessionId)
    .single()

  if (sessionError || !sessionData || new Date(sessionData.expires_at) < new Date()) {
    // Session expired or not found
    cookies().delete("session_id")
    cookies().delete("user_role") // Also delete user_role cookie when session is invalid
    return null
  }

  // Get user
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, email, role, first_name, last_name")
    .eq("id", sessionData.user_id)
    .single()

  if (userError || !userData) {
    cookies().delete("session_id")
    cookies().delete("user_role")
    return null
  }

  // Get profile with phone number
  const { data: profileData } = await supabase
    .from("profiles")
    .select("phone, avatar_url, first_name, last_name")
    .eq("id", userData.id)
    .single()

  // Combine first_name and last_name for full name
  const fullName = [profileData?.first_name || userData.first_name, profileData?.last_name || userData.last_name]
    .filter(Boolean)
    .join(" ")

  return {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: fullName,
    first_name: profileData?.first_name || userData.first_name || null,
    last_name: profileData?.last_name || userData.last_name || null,
    phone: profileData?.phone || null,
    avatar_url: profileData?.avatar_url || null,
  }
}

export async function getSession() {
  const user = await getCurrentUser()
  if (user) {
    return { user }
  }
  return null
}

// Alias export for backwards-compatibility
export { getCurrentUser as getUser }
