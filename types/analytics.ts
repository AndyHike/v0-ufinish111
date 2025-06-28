export interface GoogleAnalyticsConfig {
  measurementId: string
  enabled: boolean
}

export interface GoogleTagManagerConfig {
  containerId: string
  enabled: boolean
}

export interface FacebookPixelConfig {
  pixelId: string
  enabled: boolean
}

export interface AnalyticsConfig {
  googleAnalytics?: GoogleAnalyticsConfig
  googleTagManager?: GoogleTagManagerConfig
  facebookPixel?: FacebookPixelConfig
}

export interface CookieConsentState {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: (...args: any[]) => void
    _fbq: any
  }
}
