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
    cs: "Podmínky služby | DeviceHelp",
    en: "Terms of Service | DeviceHelp",
    uk: "Умови надання послуг | DeviceHelp",
  }

  const descriptionPatterns = {
    cs: "Přečtěte si naše podmínky služby, abyste pochopili pravidla a předpisy upravující používání našich služeb.",
    en: "Read our terms of service to understand the rules and regulations governing the use of our services.",
    uk: "Прочитайте наші умови надання послуг, щоб зрозуміти правила та положення, що регулюють використання наших послуг.",
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    alternates: {
      canonical: `${siteUrl}/${locale}/terms`,
      languages: {
        cs: `${siteUrl}/cs/terms`,
        en: `${siteUrl}/en/terms`,
        uk: `${siteUrl}/uk/terms`,
        "x-default": `${siteUrl}/cs/terms`,
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Terms" })
  const doc = await getLegalDocument("terms")
  const title = doc ? localizedTitle(doc, locale) : t("title")

  return <LegalDocumentView title={title} content={doc?.content ?? null} emptyText={t("contentPlaceholder")} />
}
