import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  try {
    console.log("🔍 getCurrentUser called")

    const sessionId = cookies().get("session_id")?.value
    console.log("🍪 Session ID from cookies:", sessionId ? "Found" : "Not found")

    if (!sessionId) {
      console.log("❌ No session ID found")
      return null
    }

    const supabase = createClient()

    // Get session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("user_id, expires_at")
      .eq("id", sessionId)
      .single()

    if (sessionError || !sessionData) {
      console.log("❌ Session not found or error:", sessionError)
      cookies().delete("session_id")
      return null
    }

    if (new Date(sessionData.expires_at) < new Date()) {
      console.log("❌ Session expired")
      cookies().delete("session_id")
      return null
    }

    console.log("✅ Valid session found for user:", sessionData.user_id)

    // Get user
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, role, first_name, last_name, remonline_id")
      .eq("id", sessionData.user_id)
      .single()

    if (userError || !userData) {
      console.error("❌ Error fetching user data:", userError)
      cookies().delete("session_id")
      return null
    }

    console.log("👤 User data:", {
      id: userData.id,
      email: userData.email,
      remonline_id: userData.remonline_id,
    })

    // Get profile with phone number
    const { data: profileData } = await supabase
      .from("profiles")
      .select("phone, avatar_url, first_name, last_name")
      .eq("id", userData.id)
      .single()

    console.log("👤 Profile data:", profileData)

    // Combine first_name and last_name for full name
    const fullName = [profileData?.first_name || userData.first_name, profileData?.last_name || userData.last_name]
      .filter(Boolean)
      .join(" ")

    const user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: fullName, // For backward compatibility
      first_name: profileData?.first_name || userData.first_name || null,
      last_name: profileData?.last_name || userData.last_name || null,
      phone: profileData?.phone || null,
      avatar_url: profileData?.avatar_url || null,
      remonline_id: userData.remonline_id,
    }

    console.log("✅ Final user object:", user)
    return user
  } catch (error) {
    console.error("💥 Error in getCurrentUser:", error)
    return null
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
