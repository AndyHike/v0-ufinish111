"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"

export async function clearUserSession() {
  cookies().delete("session_id")
  return { success: true }
}

export async function clearUserSessionsByUserId(userId: string) {
  const supabase = createClient()

  // Delete all sessions for this user from the database
  const { error } = await supabase.from("sessions").delete().eq("user_id", userId)

  if (error) {
    console.error("Error deleting user sessions:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
