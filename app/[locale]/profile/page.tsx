import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { getSession } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase"
import { syncUserProfile } from "@/lib/user/profile-sync"
import ProfileContent from "./profile-content"

export const metadata: Metadata = {
  title: "My Profile | DeviceHelp",
  robots: { index: false, follow: false },
}


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

  // Get active user-specific discounts
  const { data: personalDiscountsData } = await supabase
    .from("discounts")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_active", true)

  const userDiscounts: any[] = []

  if (personalDiscountsData) {
    personalDiscountsData.forEach((d) => {
      userDiscounts.push({
        id: d.id,
        code: d.code,
        description: d.description || "Персональна знижка",
        amount: Number(d.discount_value),
        isPercentage: d.discount_type === "percentage",
        expiresAt: d.expires_at,
      })
    })
  }

  // Get user role discount
  const { data: userRole } = await supabase
    .from("users")
    .select("role_id")
    .eq("id", session.user.id)
    .single()

  if (userRole?.role_id) {
    const { data: roleData } = await supabase
      .from("roles")
      .select("name, discount_percentage")
      .eq("id", userRole.role_id)
      .single()

    if (roleData && roleData.discount_percentage && Number(roleData.discount_percentage) > 0) {
      userDiscounts.push({
        id: `role-${userRole.role_id}`,
        code: `РІВЕНЬ: ${roleData.name.toUpperCase()}`,
        description: `Постійна знижка статусу ${roleData.name}`,
        amount: Number(roleData.discount_percentage),
        isPercentage: true,
        expiresAt: null,
      })
    }
  }

  return <ProfileContent userData={userData} locale={locale} discounts={userDiscounts} />
}
