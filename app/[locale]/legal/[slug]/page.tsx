import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getLegalDocument, isReservedLegalSlug, localizedTitle } from "@/lib/legal-documents"
import { LegalDocumentView } from "@/components/legal/legal-document-view"
import { siteUrl } from "@/lib/site-config"

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const doc = await getLegalDocument(slug)

  if (!doc) {
    return { title: "DeviceHelp", robots: { index: false, follow: true } }
  }

  const title = `${localizedTitle(doc, locale)} | DeviceHelp`

  return {
    title,
    alternates: {
      canonical: `${siteUrl}/${locale}/legal/${slug}`,
      languages: {
        cs: `${siteUrl}/cs/legal/${slug}`,
        en: `${siteUrl}/en/legal/${slug}`,
        uk: `${siteUrl}/uk/legal/${slug}`,
        "x-default": `${siteUrl}/cs/legal/${slug}`,
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function LegalDocumentPage({ params }: Props) {
  const { locale, slug } = await params

  // Reserved slugs are served by their dedicated routes (/privacy, /terms).
  if (isReservedLegalSlug(slug)) {
    notFound()
  }

  const doc = await getLegalDocument(slug)

  if (!doc) {
    notFound()
  }

  return <LegalDocumentView title={localizedTitle(doc, locale)} content={doc.content} />
}
