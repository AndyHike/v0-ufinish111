import type { Metadata } from "next"
import { ClaimForm } from "@/components/shop/claim-form"
import { shopSiteUrl } from "@/lib/site-config"

type Props = {
  params: Promise<{ locale: string }>
}

const TITLES: Record<string, string> = {
  cs: "Reklamace a odstoupení | DeviceHelp Shop",
  uk: "Рекламація та відступ від договору | DeviceHelp Shop",
  en: "Complaint & withdrawal | DeviceHelp Shop",
}

const HEADINGS: Record<string, string> = {
  cs: "Reklamace a odstoupení od smlouvy",
  uk: "Рекламація та відступ від договору",
  en: "Complaint & contract withdrawal",
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: TITLES[locale] ?? TITLES.cs,
    alternates: { canonical: `${shopSiteUrl}/${locale}/claims` },
    robots: { index: true, follow: true },
  }
}

export default async function ShopClaimsRoute({ params }: Props) {
  const { locale } = await params
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900 sm:text-4xl">{HEADINGS[locale] ?? HEADINGS.cs}</h1>
      <ClaimForm locale={locale} />
    </div>
  )
}
