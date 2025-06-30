import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ServicePageClient } from "./service-page-client"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services/${slug}?locale=${locale}`)

    if (!response.ok) {
      return {
        title: "Service not found | DeviceHelp",
        description: "The requested service could not be found.",
      }
    }

    const service = await response.json()

    const titlePatterns = {
      cs: `${service.name} - Oprava telefonů | DeviceHelp`,
      en: `${service.name} - Phone Repair | DeviceHelp`,
      uk: `${service.name} - Ремонт телефонів | DeviceHelp`,
    }

    const descriptionPatterns = {
      cs: `Profesionální ${service.name.toLowerCase()} pro mobilní telefony. Rychlé a kvalitní služby s garancí. Od ${service.stats.minPrice} Kč.`,
      en: `Professional ${service.name.toLowerCase()} for mobile phones. Fast and quality services with warranty. From ${service.stats.minPrice} CZK.`,
      uk: `Професійний ${service.name.toLowerCase()} для мобільних телефонів. Швидкі та якісні послуги з гарантією. Від ${service.stats.minPrice} грн.`,
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
      openGraph: {
        title: service.name,
        description: service.description,
        type: "website",
      },
    }
  } catch (error) {
    return {
      title: "Service | DeviceHelp",
      description: "Professional phone repair services",
    }
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug, locale } = params
  const t = await getTranslations({ locale, namespace: "Services" })

  return <ServicePageClient slug={slug} locale={locale} />
}
