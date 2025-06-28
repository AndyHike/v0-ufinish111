export interface AnalyticsConfig {
  googleAnalyticsId?: string
  googleTagManagerId?: string
  facebookPixelId?: string
}

export interface GoogleAnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface FacebookPixelEvent {
  eventName: string
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
