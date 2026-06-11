export const SUPPORTED_SHOP_LOCALES = ["cs", "uk", "en"] as const
export type SupportedShopLocale = (typeof SUPPORTED_SHOP_LOCALES)[number]

export const DEFAULT_SHOP_LOCALE: SupportedShopLocale = "cs"
export const SHOP_SUBDOMAIN = "shop"

const SHOP_ROUTE_PATTERNS = [
  /^$/,
  /^\/category\/[^/]+$/,
  /^\/product\/[^/]+$/,
  /^\/product\/[^/]+\/[^/]+$/,
  /^\/cart$/,
  /^\/checkout$/,
  /^\/checkout\/success$/,
] as const

export function stripHostPort(host: string): string {
  return host.toLowerCase().split(":")[0] ?? ""
}

export function stripTrailingSlash(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function isShopHost(host: string): boolean {
  const cleanHost = stripHostPort(host)
  return cleanHost === "shop.devicehelp.cz" || cleanHost.startsWith(`${SHOP_SUBDOMAIN}.`)
}

export function getShopPathLocale(pathname: string): SupportedShopLocale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return SUPPORTED_SHOP_LOCALES.includes(firstSegment as SupportedShopLocale)
    ? (firstSegment as SupportedShopLocale)
    : null
}

export function isAllowedShopPath(pathname: string): boolean {
  const normalizedPath = stripTrailingSlash(pathname)

  if (normalizedPath === "/") {
    return true
  }

  // Locale-less catalog paths (e.g. /category/skla) count as allowed so the
  // middleware's locale redirect canonicalizes them on the shop host (301 to
  // /cs/category/skla) instead of sending them to the main domain, where the
  // page does not exist. Mirrors isAllowedB2BPath.
  const locale = getShopPathLocale(normalizedPath)
  const suffix = locale ? normalizedPath.replace(`/${locale}`, "") || "" : normalizedPath
  return SHOP_ROUTE_PATTERNS.some((pattern) => pattern.test(suffix))
}

export function getDefaultLocalizedShopPath(pathname: string): string {
  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getShopPathLocale(normalizedPath)

  if (locale || normalizedPath.startsWith("/api")) {
    return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`
  }

  if (normalizedPath === "/") {
    return `/${DEFAULT_SHOP_LOCALE}`
  }

  return `/${DEFAULT_SHOP_LOCALE}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
}

export function getShopRedirectTarget({
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
  if (!isShopHost(host) || isAllowedShopPath(pathname)) {
    return null
  }

  const target = new URL(getDefaultLocalizedShopPath(pathname), mainBaseUrl)
  target.search = search

  return target
}

export function getShopRewritePath(host: string, pathname: string): string | null {
  if (!isShopHost(host)) {
    return null
  }

  const normalizedPath = stripTrailingSlash(pathname)
  const locale = getShopPathLocale(normalizedPath)

  if (!locale || !isAllowedShopPath(normalizedPath)) {
    return null
  }

  const suffix = normalizedPath.replace(`/${locale}`, "") || ""
  return `/shop/${locale}${suffix}`
}
