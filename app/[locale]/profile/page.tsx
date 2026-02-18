import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { getSession } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase"
import { syncUserProfile } from "@/lib/user/profile-sync"
import ProfileContent from "./profile-content"

export default async function ProfilePage() {
  const locale = await getLocale()
  const session = await getSession()

  if (!session || !session.user) {
    redirect("/auth/signin")
  }

  // Sync user profile data
  await syncUserProfile(session.user.id)

  // Get user profile data from database
  const supabase = createClient()
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone, address, created_at")
    .eq("id", session.user.id)
    .single()

  console.log("Profile data from database:", profile)
  console.log("Profile error:", profileError)

  // If profile data is missing, get from users table
  const userData = {
    ...session.user,
    first_name: profile?.first_name || session.user.first_name || null,
    last_name: profile?.last_name || session.user.last_name || null,
    phone: profile?.phone || session.user.phone || null,
    address: profile?.address || null,
    created_at: profile?.created_at || new Date().toISOString(),
  }

  console.log("User data being passed to profile component:", userData)

  return <ProfileContent userData={userData} locale={locale} />
}
