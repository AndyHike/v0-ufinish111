"use client"

/**
 * Простий «facade» для провайдера аналітики.
 * Тепер можна імпортувати як:
 *   import { AnalyticsProvider } from 'components/analytics'
 */
import { AnalyticsProvider as _AnalyticsProvider } from "@/components/analytics/analytics-provider"

export const AnalyticsProvider = _AnalyticsProvider
export default AnalyticsProvider
