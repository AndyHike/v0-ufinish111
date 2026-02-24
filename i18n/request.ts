import { getRequestConfig } from "next-intl/server"

const locales = ["cs", "uk", "en"]
const defaultLocale = "cs"

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
