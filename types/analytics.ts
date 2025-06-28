declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
    fbq: {
      (...args: any[]): void
      q: any[]
      l: number
    }
  }
}

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface CookieSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}
