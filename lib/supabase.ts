import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations using new DB
export function createClient() {
  const supabaseUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.devicehelp_SUPABASE_SERVICE_ROLE_KEY || process.env.devicehelp_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables for devicehelp database")
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

// For backward compatibility
export const createServerSupabaseClient = createClient
