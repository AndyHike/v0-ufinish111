export interface AnalyticsSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}

export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export interface GoogleAnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface FacebookPixelEvent {
  event: string
  parameters?: Record<string, any>
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: (...args: any[]) => void
    _fbq: any
  }
}
