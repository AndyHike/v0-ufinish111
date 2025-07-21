import { createServerClient as _createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Створює серверний Supabase-клієнт для **devicehelp**.
 * Використовується у Server Components, Route Handlers та Middleware.
 */
export function createClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.devicehelp_SUPABASE_URL!
  const supabaseAnonKey = process.env.devicehelp_SUPABASE_ANON_KEY!

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          /* ignore — виклик із Server Component */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        } catch {
          /* ignore — виклик із Server Component */
        }
      },
    },
  })
}

/* ======================================================================== */
/* ↓↓↓ Експорти для сумісності з існуючим кодом та вимогами деплою ↓↓↓      */
/* ======================================================================== */

/**
 * Іменований експорт, якого бракувало під час деплою.
 * Просто реекспортуємо оригінальну функцію з @supabase/ssr.
 */
export const createServerClient = _createServerClient

/**
 * Альтернативні назви, що можуть використовуватися в інших модулях.
 */
export const createServerSupabaseClient = createClient
export const createSupabaseServerClient = createClient
