export const locales = ["cs", "en", "uk"] as const
export const defaultLocale = "cs" as const

export type Locale = (typeof locales)[number]

export const languages = [
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
] as const

export const pathnames = {
  "/": "/",
  "/about": {
    cs: "/o-nas",
    en: "/about",
    uk: "/pro-nas",
  },
  "/contact": {
    cs: "/kontakt",
    en: "/contact",
    uk: "/kontakt",
  },
  "/brands": {
    cs: "/znacky",
    en: "/brands",
    uk: "/brendy",
  },
  "/models": {
    cs: "/modely",
    en: "/models",
    uk: "/modeli",
  },
  "/series": {
    cs: "/serie",
    en: "/series",
    uk: "/serii",
  },
} as const

export const localePrefix = "always" as const

export const port = process.env.PORT || 3000
export const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${port}`
