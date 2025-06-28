export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

export interface CookieConsentState {
  consent: CookieConsent
  showBanner: boolean
  hasInteracted: boolean
  consentDate: string | null
}

export interface CookieCategoryInfo {
  id: keyof CookieConsent
  name: string
  description: string
  required: boolean
  services: string[]
}

export interface CookieSettings {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  facebookPixelId?: string
  cookieBannerEnabled: boolean
  cookieConsentVersion: string
}
