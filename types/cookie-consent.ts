export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  timestamp: number
  version: string
}

export interface CookieSettings {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  facebookPixelId?: string
  cookieBannerEnabled: boolean
  cookieConsentVersion: string
}

export type CookieCategory = "necessary" | "analytics" | "marketing"

export interface CookieCategoryInfo {
  id: CookieCategory
  name: string
  description: string
  required: boolean
  services: string[]
}
