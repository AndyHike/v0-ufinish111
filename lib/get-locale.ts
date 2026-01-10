import { cookies, headers } from "next/headers"
import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

const locales = ["cs", "uk", "en"]
const defaultLocale = "cs"

export async function getLocale() {
  // Check if locale is set in cookie
  const cookieStore = cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")
  if (localeCookie?.value && locales.includes(localeCookie.value)) {
    return localeCookie.value
  }

  // Check if locale is in the pathname
  const headersList = headers()
  const pathname = headersList.get("x-pathname") || ""
  const segments = pathname.split("/")
  const pathnameLocale = segments[1]
  if (pathnameLocale && locales.includes(pathnameLocale)) {
    return pathnameLocale
  }

  // Negotiate based on Accept-Language header
  const negotiatorHeaders = {
    "accept-language": headersList.get("accept-language") || "",
  }
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()

  try {
    return match(languages, locales, defaultLocale)
  } catch (error) {
    return defaultLocale
  }
}
