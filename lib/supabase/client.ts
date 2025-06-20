// Клієнтський клієнт Supabase
import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Додайте цей рядок ↓
export { supabaseCreateClient as createClient }

let supabaseClient: ReturnType<typeof supabaseCreateClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseClient = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseClient
}
