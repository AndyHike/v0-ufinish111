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
  "/services": {
    cs: "/sluzby",
    en: "/services",
    uk: "/poslugy",
  },
} as const

export const localePrefix = "always" as const

export type Pathnames = typeof pathnames
