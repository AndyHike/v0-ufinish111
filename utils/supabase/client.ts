import { createClient as _createClient } from "@supabase/supabase-js"

// Використовуємо ТІЛЬКИ нову devicehelp базу
const supabaseUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Статичний клієнт для React-компонентів */
export const supabase = _createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Іменований експорт, потрібний під час деплою */
export function createClient() {
  return _createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

// Named helper so other modules can import { createSupabaseClient }
export const createSupabaseClient = createClient

export default supabase
