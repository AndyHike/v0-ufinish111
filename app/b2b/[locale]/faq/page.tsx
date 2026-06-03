import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { B2BFAQPage } from "@/components/b2b/b2b-faq-page"
import { toOGLocale } from "@/lib/og-locale"
import { b2bSiteUrl } from "@/lib/site-config"

interface FAQPageProps {
  params: Promise<{ locale: string }>
}

const SUPPORTED_LOCALE_PARAMS = [{ locale: "cs" }, { locale: "uk" }, { locale: "en" }]

export const revalidate = 3600

export function generateStaticParams() {
  return SUPPORTED_LOCALE_PARAMS
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "B2B.faq" })
  const canonicalUrl = `${b2bSiteUrl}/${locale}/faq`

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    metadataBase: new URL(b2bSiteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        cs: `${b2bSiteUrl}/cs/faq`,
        uk: `${b2bSiteUrl}/uk/faq`,
        en: `${b2bSiteUrl}/en/faq`,
        "x-default": `${b2bSiteUrl}/cs/faq`,
      },
    },
    openGraph: {
      title: t("metadataTitle"),
      description: t("metadataDescription"),
      url: canonicalUrl,
      siteName: "DeviceHelp",
      locale: toOGLocale(locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadataTitle"),
      description: t("metadataDescription"),
    },
  }
}

export default async function FAQPage({ params }: FAQPageProps) {
  const { locale } = await params

  return <B2BFAQPage locale={locale} />
}
