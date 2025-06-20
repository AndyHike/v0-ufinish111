"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useSiteSettings } from "@/hooks/use-site-settings"

/**
 * Тип налаштувань сайту
 */
export interface SiteSettings {
  defaultLanguage: string
  siteLogo: string
  siteFavicon: string
}

/**
 * Тип контексту з додатковими властивостями
 */
interface SettingsContextType {
  settings: SiteSettings
  loading: boolean
  error: string | null
  clearCache?: () => void
}

/**
 * Контекст з налаштуваннями сайту
 */
const SettingsContext = createContext<SettingsContextType | null>(null)

/**
 * Провайдер налаштувань
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const siteSettings = useSiteSettings()

  return <SettingsContext.Provider value={siteSettings}>{children}</SettingsContext.Provider>
}

/**
 * Хук для отримання налаштувань з контексту
 * УВАГА: Може використовуватися тільки в клієнтських компонентах!
 */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext)

  if (context === null) {
    throw new Error("useSettings must be used within a SettingsProvider and only in client components")
  }

  return context
}

/**
 * Дефолтний експорт
 */
export default SettingsProvider
