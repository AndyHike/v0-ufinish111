import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

// Dynamic 1200×630 Open Graph card for the shop (platforms expect ~1.91:1).
// Without ?title it renders the brand card (home page); with ?title (+ optional
// ?price and ?img) it renders the product card: big headline, price badge, CTA
// chip and the product photo on the right. See buildShopOgImageUrl in
// lib/shop/seo.ts for the URL contract.

const WIDTH = 1200
const HEIGHT = 630

const OG_COPY = {
  cs: {
    slogan: "Příslušenství a náhradní díly pro telefony",
    cta: "Zjistit více →",
  },
  uk: {
    slogan: "Аксесуари та запчастини для телефонів",
    cta: "Дізнатись більше →",
  },
  en: {
    slogan: "Phone accessories and spare parts",
    cta: "Learn more →",
  },
} as const

type OgLocale = keyof typeof OG_COPY

const PRICE_FORMAT_LOCALE: Record<OgLocale, string> = {
  cs: "cs-CZ",
  uk: "uk-UA",
  en: "en-US",
}

// Only hosts the storefront itself loads images from (next.config remotePatterns).
const ALLOWED_IMAGE_HOSTS = [".r2.dev", ".r2.cloudflarestorage.com", ".supabase.co", "devicehelp.cz"]

function sanitizeImageUrl(value: string | null): string | null {
  if (!value) {
    return null
  }
  try {
    const url = new URL(value)
    if (url.protocol !== "https:") {
      return null
    }
    const host = url.hostname
    return ALLOWED_IMAGE_HOSTS.some((allowed) =>
      allowed.startsWith(".") ? host.endsWith(allowed) : host === allowed || host.endsWith(`.${allowed}`),
    )
      ? url.toString()
      : null
  } catch {
    return null
  }
}

// Inter subset fetched per request (subset by `text`, so the payload stays tiny);
// covers the Czech diacritics and Cyrillic that satori's built-in font lacks.
async function loadGoogleFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`
    const cssResponse = await fetch(cssUrl)
    if (!cssResponse.ok) {
      return null
    }
    const css = await cssResponse.text()
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)
    if (!match) {
      return null
    }
    const fontResponse = await fetch(match[1])
    return fontResponse.ok ? await fontResponse.arrayBuffer() : null
  } catch {
    return null
  }
}

function clampTitle(title: string): string {
  return title.length > 90 ? `${title.slice(0, 89).trimEnd()}…` : title
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const localeParam = params.get("locale")
  const locale: OgLocale = localeParam === "uk" || localeParam === "en" ? localeParam : "cs"
  const copy = OG_COPY[locale]
  const title = params.get("title")?.trim().slice(0, 120) || null
  const priceParam = Number(params.get("price"))
  const price =
    Number.isFinite(priceParam) && priceParam > 0
      ? new Intl.NumberFormat(PRICE_FORMAT_LOCALE[locale], {
          style: "currency",
          currency: "CZK",
          maximumFractionDigits: 0,
        }).format(priceParam)
      : null
  const image = sanitizeImageUrl(params.get("img"))

  const headline = title ? clampTitle(title) : "DeviceHelp Shop"
  const boldText = `DeviceHelpShop${headline}${price ?? ""}0123456789 `
  const regularText = `${copy.slogan}${copy.cta}shop.devicehelp.cz `
  const [bold, regular] = await Promise.all([loadGoogleFont(700, boldText), loadGoogleFont(400, regularText)])
  const fonts = [
    ...(bold ? [{ name: "Inter", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const }] : []),
  ]

  const background = "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1d4ed8 130%)"

  const brand = (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontSize: 36, fontWeight: 700, color: "#ffffff" }}>DeviceHelp</span>
      <span style={{ fontSize: 36, fontWeight: 700, color: "#60a5fa" }}>Shop</span>
    </div>
  )

  const ctaChip = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#2563eb",
        borderRadius: 14,
        color: "#ffffff",
        fontSize: 28,
        fontWeight: 400,
        padding: "14px 28px",
      }}
    >
      {copy.cta}
    </div>
  )

  const content = title ? (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background,
        color: "#ffffff",
        fontFamily: "Inter",
        padding: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          paddingRight: image ? 40 : 0,
        }}
      >
        {brand}
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>{headline}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {price ? (
            <div
              style={{
                display: "flex",
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "2px solid rgba(255,255,255,0.35)",
                borderRadius: 14,
                fontSize: 34,
                fontWeight: 700,
                padding: "12px 26px",
              }}
            >
              {price}
            </div>
          ) : null}
          {ctaChip}
        </div>
      </div>
      {image ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 400,
            height: 530,
            backgroundColor: "#ffffff",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" width={400} height={530} style={{ objectFit: "contain" }} />
        </div>
      ) : null}
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background,
        color: "#ffffff",
        fontFamily: "Inter",
        gap: 32,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 84, fontWeight: 700, color: "#ffffff" }}>DeviceHelp</span>
        <span style={{ fontSize: 84, fontWeight: 700, color: "#60a5fa" }}>Shop</span>
      </div>
      <div style={{ display: "flex", fontSize: 40, fontWeight: 400, color: "#cbd5e1" }}>{copy.slogan}</div>
      {ctaChip}
      <div style={{ display: "flex", fontSize: 26, fontWeight: 400, color: "#94a3b8" }}>shop.devicehelp.cz</div>
    </div>
  )

  return new ImageResponse(content, {
    width: WIDTH,
    height: HEIGHT,
    fonts: fonts.length ? fonts : undefined,
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  })
}
