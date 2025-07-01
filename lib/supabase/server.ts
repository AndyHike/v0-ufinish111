// A tiny helper to create (and memo-ize) a server-side Supabase client.
// All server code should import { createClient } from "@/lib/supabase/server"

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

// Keep a single instance around for the whole Node.js process
let cached: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client that can be safely used on the server.
 * Environment variables:
 *   - SUPABASE_URL  (or NEXT_PUBLIC_SUPABASE_URL as fallback)
 *   - SUPABASE_SERVICE_ROLE_KEY (preferred for server)
 *     – falls back to SUPABASE_ANON_KEY if you only need anon access
 */
export function createClient(): SupabaseClient {
  if (cached) return cached

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase URL or Service Role / Anon key is missing. " +
        "Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
    )
  }

  cached = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cached
}
