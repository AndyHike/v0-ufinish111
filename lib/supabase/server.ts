import { createServerClient as createSupabaseServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

let cachedClient: any = null

// Use public client for build-time and ISR caching
// This is safe because all the data we query is public
export async function createClient() {
  if (cachedClient) return cachedClient

  const cookieStore = await cookies()

  cachedClient = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON_KEY instead of SERVICE_ROLE_KEY to enable ISR caching
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error("[v0] Cookie set error:", error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            console.error("[v0] Cookie remove error:", error)
          }
        },
      },
    }
  )

  return cachedClient
}

// Export for compatibility
export const createServerClient = createClient
