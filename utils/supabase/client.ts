import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Використовуємо нову devicehelp базу
const devicehelpUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
const devicehelpAnonKey = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(devicehelpUrl, devicehelpAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Експортуємо також функцію для створення клієнта
export function createSupabaseClient() {
  return createClient(devicehelpUrl, devicehelpAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
