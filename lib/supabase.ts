import { createClient } from "@supabase/supabase-js"

// Використовуємо ТІЛЬКИ нову devicehelp базу
const supabaseUrl = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase
