import { getTranslations } from "next-intl/server"
import type { Metadata } from "next"
import { getLegalDocument, localizedTitle } from "@/lib/legal-documents"
import { LegalDocumentView } from "@/components/legal/legal-document-view"
import { siteUrl } from "@/lib/site-config"

type Props = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const titlePatterns = {
    cs: "Zásady ochrany osobních údajů | DeviceHelp",
    en: "Privacy Policy | DeviceHelp",
    uk: "Політика конфіденційності | DeviceHelp",
  }

  const descriptionPatterns = {
    cs: "Přečtěte si naše zásady ochrany osobních údajů, abyste pochopili, jak chráníme vaše osobní údaje.",
    en: "Read our privacy policy to understand how we protect your personal data.",
    uk: "Прочитайте нашу політику конфіденційності, щоб зрозуміти, як ми захищаємо ваші особисті дані.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    alternates: {
      canonical: `${siteUrl}/${locale}/privacy`,
      languages: {
        cs: `${siteUrl}/cs/privacy`,
        en: `${siteUrl}/en/privacy`,
        uk: `${siteUrl}/uk/privacy`,
        "x-default": `${siteUrl}/cs/privacy`,
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Privacy" })
  const doc = await getLegalDocument("privacy")
  const title = doc ? localizedTitle(doc, locale) : t("title")

  return <LegalDocumentView title={title} content={doc?.content ?? null} emptyText={t("contentPlaceholder")} />
}
