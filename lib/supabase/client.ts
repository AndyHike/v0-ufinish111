import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Використовуємо ТІЛЬКИ нову devicehelp базу
  return createBrowserClient(
    process.env.devicehelp_NEXT_PUBLIC_SUPABASE_URL!,
    process.env.devicehelp_NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
