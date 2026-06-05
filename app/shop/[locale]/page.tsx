import type { Metadata } from "next"

import { ShopHomePage } from "@/components/shop/shop-home-page"
import { getMockShopHomeData } from "@/lib/shop/catalog"
import { shopSiteUrl } from "@/lib/site-config"
import type { ShopLocale } from "@/lib/shop/types"

const SUPPORTED_LOCALE_PARAMS = [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]

const HOME_METADATA = {
  cs: {
    title: "DeviceHelp Shop | Prislusenstvi a dily pro telefony",
    description: "Premium prislusenstvi, nahradni dily a budouci telefony od DeviceHelp.",
  },
  uk: {
    title: "DeviceHelp Shop | Аксесуари та запчастини для телефонів",
    description: "Преміальні аксесуари, запчастини та майбутні телефони від DeviceHelp.",
  },
  en: {
    title: "DeviceHelp Shop | Phone accessories and parts",
    description: "Premium phone accessories, replacement parts, and future phone offers from DeviceHelp.",
  },
} as const

export const revalidate = 3600

export function generateStaticParams() {
  return SUPPORTED_LOCALE_PARAMS
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: ShopLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const canonicalUrl = `${shopSiteUrl}/${locale}`
  const metadata = HOME_METADATA[locale] ?? HOME_METADATA.cs

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
    },
  }
}

export default async function ShopHomeRoute({ params }: { params: Promise<{ locale: ShopLocale }> }) {
  const { locale } = await params
  const data = getMockShopHomeData(locale)

  return (
    <ShopHomePage
      locale={locale}
      heroTitle={data.hero.title}
      heroDescription={data.hero.description}
      heroImage={data.hero.image}
      categories={data.categories}
      featuredProducts={data.featuredProducts}
    />
  )
}
