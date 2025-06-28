"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import type { ReactNode } from "react"

interface Props {
  children: ReactNode
  session?: Session | null
}

/**
 * Головний провайдер сесії.
 * Обгортає next-auth SessionProvider і надає його під двома назвами:
 *   – SessionProvider  (основний)
 *   – NextAuthProvider (для зворотної сумісності зі старим кодом)
 */
export function SessionProvider({ children, session }: Props) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>
}

/* Синонім для legacy-імпортів */
export const NextAuthProvider = SessionProvider

/* Необовʼязково: default-експорт, якщо десь використовується */
export default SessionProvider
