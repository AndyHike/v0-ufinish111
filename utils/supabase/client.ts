import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Public Supabase client for build-time and client-side operations
 * Does NOT require authentication context or cookies
 * Used for generateStaticParams() and public data fetching
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

  return createSupabaseClient(supabaseUrl, supabaseKey)
}

export default createClient
