import { getRequestConfig } from "next-intl/server"

const locales = ["cs", "uk", "en"]
const defaultLocale = "cs"

export default getRequestConfig(async ({ locale }) => {
  const requestedLocale = locale || defaultLocale

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(requestedLocale)) {
    return {
      messages: {},
      locale: defaultLocale,
    }
  }

  // Load messages for the requested locale
  const messages = await import(`../messages/${requestedLocale}.json`).then((module) => module.default).catch(() => ({}))

  return {
    locale: requestedLocale,
    messages,
    timeZone: "Europe/Kiev",
  }
})
