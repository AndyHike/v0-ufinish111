export const siteLogoPath = "/devicehelp-logo.webp"
export const siteFaviconPath = "/devicehelp-favicon-32.png"
export const siteFavicon192Path = "/devicehelp-favicon-192.png"
export const siteAppleIconPath = "/devicehelp-favicon-180.png"

export const siteIconMetadata = {
  icon: [
    {
      url: siteFaviconPath,
      type: "image/png",
      sizes: "32x32",
    },
    {
      url: siteFavicon192Path,
      type: "image/png",
      sizes: "192x192",
    },
  ],
  apple: [
    {
      url: siteAppleIconPath,
      type: "image/png",
      sizes: "180x180",
    },
  ],
  shortcut: siteFaviconPath,
}

const legacyIconMarkers = [
  "apple-icon.png",
  "icon-dark-32x32.png",
  "icon-light-32x32.png",
  "site-assets/favicon/1750418444610-hgnxmfio3rv.png",
  "/icon.svg",
]

const legacyExactIconPaths = ["/favicon.ico"]

export function normalizeSiteAssetPath(value: string | null | undefined, fallback: string) {
  if (!value) return fallback

  const trimmedValue = value.trim()
  if (legacyExactIconPaths.includes(trimmedValue)) return fallback

  const lowerValue = trimmedValue.toLowerCase()
  return legacyIconMarkers.some((marker) => lowerValue.includes(marker)) ? fallback : trimmedValue
}
