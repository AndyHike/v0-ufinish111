"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type React from "react"

/**
 * Глобальний провайдер next-auth.
 *
 * Використовуйте `useSession()` у будь-якому клієнтському компоненті, що лежить
 * всередині цього провайдера.
 */
export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
}

/* Додатковий експорт, якщо хтось очікує цю назву */
export { SessionProvider as NextAuthProvider }
