export interface GoogleAnalyticsConfig {
  gaId: string
  consent: boolean
}

export interface GoogleTagManagerConfig {
  gtmId: string
  consent: boolean
}

export interface FacebookPixelConfig {
  pixelId: string
  consent: boolean
}

export interface AnalyticsSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: (...args: any[]) => void
    _fbq: any
  }
}
