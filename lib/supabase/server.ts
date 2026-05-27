import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Use public client for build-time and ISR caching
// This is safe because all the data we query is public
export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON_KEY instead of SERVICE_ROLE_KEY to enable ISR caching
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          } catch (error) {
            console.error("[v0] Cookie set error:", error)
          }
        },
      },
    }
  )
}

// Export for compatibility
export const createServerClient = createClient
