import { getRequestConfig } from "next-intl/server"
import { notFound } from "next/navigation"

// Can be imported from a shared config
export const locales = ["en", "cs", "uk"]

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound()

  try {
    // Use explicit imports instead of dynamic imports
    let messages
    switch (locale) {
      case "cs":
        messages = (await import("./messages/cs.json")).default
        break
      case "en":
        messages = (await import("./messages/en.json")).default
        break
      case "uk":
      default:
        messages = (await import("./messages/uk.json")).default
        break
    }

    return {
      messages,
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    // Return empty messages object as fallback
    return {
      messages: {},
    }
  }
})
