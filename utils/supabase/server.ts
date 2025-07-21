import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()
  const supabaseUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables for devicehelp database")
  }

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
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

export const createServerClient = createClient
export const createServerSupabaseClient = createClient
