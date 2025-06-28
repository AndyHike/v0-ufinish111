export const locales = ["cs", "en", "uk"] as const
export const defaultLocale = "cs" as const

export type Locale = (typeof locales)[number]

export const languages = {
  cs: "Čeština",
  en: "English",
  uk: "Українська",
} as const

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
} as const

export const localePrefix = "always" as const
