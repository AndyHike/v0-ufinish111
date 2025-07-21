import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.devicehelp_SUPABASE_URL!
const supabaseAnonKey = process.env.devicehelp_SUPABASE_ANON_KEY!

export function getSupabaseClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
