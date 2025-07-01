"use client"

/**
 * Re-експортує CookieConsentProvider з контексту,
 * щоб інші частини застосунку могли імпортувати його з
 * «components/cookie-consent-provider».
 */
import { CookieConsentProvider as _CookieConsentProvider } from "@/contexts/cookie-consent-context"

export const CookieConsentProvider = _CookieConsentProvider
export default CookieConsentProvider
