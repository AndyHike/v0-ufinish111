export const defaultLocale = "cs" as const
export const locales = ["cs", "en", "uk"] as const

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
  "/services": {
    cs: "/sluzby",
    en: "/services",
    uk: "/poslugy",
  },
} as const

export type Pathnames = typeof pathnames
