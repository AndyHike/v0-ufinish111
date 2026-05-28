export const SUPPORTED_LOCALES = ["cs", "uk", "en"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = "cs"
export const B2B_SUBDOMAIN = "b2b"
export const B2B_ALLOWED_SUFFIXES = ["", "/faq"] as const

export function stripHostPort(host: string): string {
  return host.toLowerCase().split(":")[0] ?? ""
}

export function isB2BHost(host: string): boolean {
  const cleanHost = stripHostPort(host)
  return cleanHost === "b2b.devicehelp.cz" || cleanHost.startsWith(`${B2B_SUBDOMAIN}.`)
}

export function stripTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function getPathLocale(pathname: string): SupportedLocale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale) ? (firstSegment as SupportedLocale) : null
}

export function getDefaultLocalizedB2BPath(pathname: string): string {
  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getPathLocale(normalizedPath)

  if (locale) {
    return normalizedPath || `/${DEFAULT_LOCALE}`
  }

  if (normalizedPath === "/") {
    return `/${DEFAULT_LOCALE}`
  }

  return `/${DEFAULT_LOCALE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
}

export function isAllowedB2BPath(pathname: string): boolean {
  const normalizedPath = stripTrailingSlash(pathname)

  if (normalizedPath === "/") {
    return true
  }

  const locale = getPathLocale(normalizedPath)
  if (!locale) {
    return false
  }

  const suffix = normalizedPath.replace(`/${locale}`, "") || ""
  return B2B_ALLOWED_SUFFIXES.includes(suffix as (typeof B2B_ALLOWED_SUFFIXES)[number])
}

export function getB2BRedirectTarget({
  host,
  pathname,
  search,
  mainBaseUrl,
}: {
  host: string
  pathname: string
  search: string
  mainBaseUrl: string
}): URL | null {
  if (!isB2BHost(host) || isAllowedB2BPath(pathname)) {
    return null
  }

  const targetPath = getDefaultLocalizedB2BPath(pathname)
  const target = new URL(targetPath, mainBaseUrl)
  target.search = search

  return target
}
