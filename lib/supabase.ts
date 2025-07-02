import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Core Supabase configuration
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.SUPABASE_ANON_KEY!

/**
 * createClient
 *  – Named export expected by the rest of the code-base.
 *  – By default uses the anon key (safe for client-side use),
 *    but you can pass a different key (e.g. the service role) when needed.
 */
export function createClient(key: string = ANON_KEY): SupabaseClient {
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
  })
}

/**
 * supabase
 *  – Pre-configured server-side client that has full access
 *    (uses the service-role key). Import when you need elevated privileges.
 */
export const supabase = createClient(SERVICE_ROLE)

/**
 * createServerSupabaseClient
 *  – Alias kept for backward compatibility with legacy imports.
 */
export const createServerSupabaseClient = createClient
