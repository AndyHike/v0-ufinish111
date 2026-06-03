import type { Metadata } from "next"

import { B2BHomePage } from "@/components/b2b/b2b-home-page"
import { toOGLocale } from "@/lib/og-locale"
import { b2bSiteUrl } from "@/lib/site-config"

interface B2BHomeRouteProps {
  params: Promise<{ locale: string }>
}

const SUPPORTED_LOCALE_PARAMS = [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]

export const revalidate = 3600

export function generateStaticParams() {
  return SUPPORTED_LOCALE_PARAMS
}

export async function generateMetadata({ params }: B2BHomeRouteProps): Promise<Metadata> {
  const { locale } = await params

  const seoData = {
    cs: {
      title: "B2B servis mobilních telefonů pro firmy | DeviceHelp",
      description:
        "Opravy firemních mobilních telefonů pro firmy, OSVČ a organizace v Praze. Registrace firemního účtu, záruka a jasná komunikace.",
    },
    uk: {
      title: "Ремонт мобільних телефонів для компаній | DeviceHelp",
      description:
        "Ремонт службових мобільних телефонів для компаній, підприємців та організацій у Празі. Реєстрація акаунта для компанії, гарантія та зрозуміла комунікація.",
    },
    en: {
      title: "Mobile Phone Repair for Companies | DeviceHelp",
      description:
        "Company mobile phone repairs for businesses, entrepreneurs, and organizations in Prague. Business account registration, warranty, and clear communication.",
    },
  }

  const currentSeo = seoData[locale as keyof typeof seoData] || seoData.cs
  const canonicalUrl = `${b2bSiteUrl}/${locale}`

  return {
    title: currentSeo.title,
    description: currentSeo.description,
    metadataBase: new URL(b2bSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${b2bSiteUrl}/cs`,
        uk: `${b2bSiteUrl}/uk`,
        en: `${b2bSiteUrl}/en`,
        "x-default": `${b2bSiteUrl}/cs`,
      },
    },
    openGraph: {
      title: currentSeo.title,
      description: currentSeo.description,
      url: canonicalUrl,
      siteName: "DeviceHelp",
      locale: toOGLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: currentSeo.title,
      description: currentSeo.description,
    },
  }
}

export default async function B2BHomeRoute({ params }: B2BHomeRouteProps) {
  const { locale } = await params

  return <B2BHomePage locale={locale} />
}
