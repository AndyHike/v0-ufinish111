export const locales = ["uk", "cs", "en"] as const
export const defaultLocale = "uk" as const

export type Locale = (typeof locales)[number]

export const languages = [
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "cs", name: "Čeština", flag: "🇨🇿" },
  { code: "en", name: "English", flag: "🇬🇧" },
] as const

export const pathnames = {
  "/": "/",
  "/about": {
    uk: "/pro-nas",
    cs: "/o-nas",
    en: "/about",
  },
  "/contact": {
    uk: "/kontakt",
    cs: "/kontakt",
    en: "/contact",
  },
  "/services": {
    uk: "/poslugy",
    cs: "/sluzby",
    en: "/services",
  },
} as const

export const localePrefix = "always" as const
