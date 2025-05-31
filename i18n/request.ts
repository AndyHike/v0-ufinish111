import { getRequestConfig } from "next-intl/server"

// Hardcode the locales and defaultLocale to avoid importing from i18n.js
const locales = ["uk", "cs", "en"]
const defaultLocale = "uk"

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) {
    return {
      messages: {},
      locale: defaultLocale,
    }
  }

  // Load messages for the requested locale
  const messages = await import(`../messages/${locale}.json`).then((module) => module.default).catch(() => ({}))

  return {
    locale,
    messages,
    timeZone: "Europe/Kiev",
  }
})
