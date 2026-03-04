import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
  const cookieStore = await cookies()
  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(
        name: string,
        value: string,
        options: {
          path: string
          maxAge: number
          domain?: string
          secure: boolean
          sameSite: "lax" | "strict" | "none"
        },
      ) {
        cookieStore.set({ name, value, ...options })
      },
      remove(
        name: string,
        options: { path: string; domain?: string; secure: boolean; sameSite: "lax" | "strict" | "none" },
      ) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 })
      },
    },
  })
}

// Експортуємо createServerClient для сумісності з існуючим кодом
export const createServerClient = createClient
export const createServerSupabaseClient = createClient
