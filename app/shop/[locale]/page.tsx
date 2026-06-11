import type { Metadata } from "next"

import { ShopHomePage } from "@/components/shop/shop-home-page"
import { StructuredData } from "@/components/shop/structured-data"
import { getShopHomeData } from "@/lib/shop/data"
import { buildShopOgImageUrl, buildShopOrganizationJsonLd, buildShopWebSiteJsonLd } from "@/lib/shop/seo"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopLocale } from "@/lib/shop/types"

// Meta descriptions follow "what we sell + benefit + CTA" and stay in the
// 120-160 character window search engines display in full.
const HOME_METADATA = {
  cs: {
    title: "DeviceHelp Shop | Příslušenství a díly pro telefony",
    description:
      "Prémiové příslušenství, ochranná skla, nabíječky a náhradní díly pro telefony. Skladem v Praze, rychlé doručení po celé ČR — vybírejte na DeviceHelp Shop.",
  },
  uk: {
    title: "DeviceHelp Shop | Аксесуари та запчастини для телефонів",
    description:
      "Преміальні аксесуари, захисне скло, зарядки та запчастини для телефонів. Швидка доставка Zásilkovna по всій Чехії — обирайте онлайн у DeviceHelp Shop.",
  },
  en: {
    title: "DeviceHelp Shop | Phone accessories and parts",
    description:
      "Premium phone accessories, protective glass, chargers and spare parts in stock. Fast Zásilkovna delivery across Czechia — shop online at DeviceHelp Shop.",
  },
} as const

// Statically generated with real API data, then kept fresh by ISR + the admin
// revalidation webhook (/api/shop/revalidate). No mock is ever rendered.
export const revalidate = 3600

export function generateStaticParams() {
  return [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const canonicalUrl = `${shopSiteUrl}/${locale}`
  const metadata = HOME_METADATA[locale] ?? HOME_METADATA.cs
  // Branded 1200×630 card from the dynamic OG endpoint (no ?title → brand mode).
  const ogImageUrl = buildShopOgImageUrl({ locale })
  const ogImages = [{ url: ogImageUrl, width: 1200, height: 630, alt: metadata.title }]

  return {
    title: metadata.title,
    description: metadata.description,
    metadataBase: new URL(shopSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${shopSiteUrl}/cs`,
        uk: `${shopSiteUrl}/uk`,
        en: `${shopSiteUrl}/en`,
        "x-default": `${shopSiteUrl}/cs`,
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      siteName: "DeviceHelp Shop",
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [ogImageUrl],
    },
  }
}

export default async function ShopHomeRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params
  const data = await getShopHomeData(locale)

  return (
    <>
      <StructuredData id="shop-organization-jsonld" data={buildShopOrganizationJsonLd()} />
      <StructuredData id="shop-website-jsonld" data={buildShopWebSiteJsonLd(locale)} />
      <ShopHomePage
        locale={locale}
        heroTitle={data.hero.title}
        heroDescription={data.hero.description}
        heroImage={data.hero.image}
        categoryTree={data.categoryTree}
        featuredProducts={data.featuredProducts}
        bannerSlides={data.bannerSlides}
      />
    </>
  )
}
