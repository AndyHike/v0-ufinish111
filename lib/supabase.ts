import { createClient as _createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Статичний клієнт, яким можна користуватися у клієнтському коді */
export const supabase = _createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Функція-фабрика для створення нового клієнта (потрібен іменований експорт createClient) */
export function createClient() {
  return _createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

/**
 * Для сумісності з існуючим кодом та вимогами деплою.
 * У серверному оточенні використовуйте '@/utils/supabase/server'.
 */
export const createServerSupabaseClient = createClient

export default supabase
