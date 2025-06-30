import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Повертає singleton-клієнт Supabase для серверного оточення.
 * Використовує змінні оточення SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY,
 * які вже присутні у Vercel.
 */
let supabase: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      throw new Error("SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY не задані у змінних оточення.")
    }

    supabase = createSupabaseClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabase
}
