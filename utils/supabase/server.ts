import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  // Використовуємо ТІЛЬКИ нову devicehelp базу
  const supabaseUrl = process.env.devicehelp_SUPABASE_URL!
  const supabaseAnonKey = process.env.devicehelp_SUPABASE_ANON_KEY!

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  })
}

// Re-export the original helper so other modules can import it.
export const createServerClient = _createServerClient

// Експорти для сумісності
export const createServerSupabaseClient = createClient
