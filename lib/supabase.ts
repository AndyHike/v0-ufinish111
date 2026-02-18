import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

// For backward compatibility
export const createServerSupabaseClient = createClient
