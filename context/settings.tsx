"use client"

import type React from "react"

import { createContext, useContext } from "react"
import { useSiteSettings } from "@/hooks/use-site-settings"

/**
 * Тип налаштувань сайту. Можете розширювати за потребою.
 */
export interface SiteSettings {
  logoUrl?: string | null
  faviconUrl?: string | null
  defaultLanguage?: string
  allowRegistration?: boolean
}

/**
 * Контекст з налаштуваннями сайту.
 * За замовчанням — null, щоб можна було відслідкувати неправильне використання.
 */
const SettingsContext = createContext<SiteSettings | null>(null)

/**
 * Провайдер, який підтягує налаштування через кастомний хук
 * і передає їх у контекст.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useSiteSettings()

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

/**
 * Іменований хук, що витягує налаштування з контексту.
 * Викидає помилку, якщо використаний поза `SettingsProvider`.
 */
export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (ctx === null) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return ctx
}

/**
 * Дефолтний експорт залишаємо провайдер,
 * щоб можна було імпортувати `SettingsProvider` за замовчанням.
 */
export default SettingsProvider
