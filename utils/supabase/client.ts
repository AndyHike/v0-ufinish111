import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Public Supabase client for build-time and client-side operations
 * Does NOT require authentication context or cookies
 * Used for generateStaticParams() and public data fetching
 */
export function createClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default createClient
