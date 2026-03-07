import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import { cache } from "react"

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session_id")?.value

  if (!sessionId) {
    return null
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      user_id,
      expires_at,
      users!inner (
        id,
        email,
        role,
        first_name,
        last_name,
        profiles (
          phone,
          avatar_url,
          first_name,
          last_name
        )
      )
    `)
    .eq("id", sessionId)
    .single()

  if (error || !data || new Date(data.expires_at) < new Date()) {
    // Session expired or not found
    const cookies_instance = await cookies()
    cookies_instance.delete("session_id")
    cookies_instance.delete("user_role")
    return null
  }

  // data.users could be an array or object depending on the generated types
  const userData: any = Array.isArray(data.users) ? data.users[0] : data.users
  const profileData = userData?.profiles ? (Array.isArray(userData.profiles) ? userData.profiles[0] : userData.profiles) : null

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
})

export async function getSession() {
  const user = await getCurrentUser()
  if (user) {
    return { user }
  }
  return null
}

// Alias export for backwards-compatibility
export { getCurrentUser as getUser }
