// Типи для Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: any
  }
}

export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface PageViewEvent {
  page_title: string
  page_location: string
  page_path: string
}

export interface ConversionEvent {
  currency?: string
  value?: number
  transaction_id?: string
  items?: Array<{
    item_id: string
    item_name: string
    category: string
    quantity: number
    price: number
  }>
}

export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export interface CookieSettings {
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  cookie_banner_enabled: boolean
  analytics_enabled: boolean
  marketing_enabled: boolean
}
