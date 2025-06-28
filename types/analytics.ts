export interface AnalyticsEvent {
  action: string
  category: string
  label?: string
  value?: number
}

export interface GTMEvent {
  event: string
  [key: string]: any
}

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
    fbq: (...args: any[]) => void
    _fbq: any
  }
}
