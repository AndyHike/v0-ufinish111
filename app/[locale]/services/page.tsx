import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ServicesPageClient } from "./services-page-client"

interface ServicesPageProps {
  params: {
    locale: string
  }
}

async function getServices() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return []
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const t = await getTranslations("Services")

  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      type: "website",
    },
  }
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const services = await getServices()
  const t = await getTranslations("Services")

  return (
    <ServicesPageClient
      services={services}
      locale={params.locale}
      translations={{
        title: t("title"),
        subtitle: t("subtitle"),
        searchPlaceholder: t("searchPlaceholder"),
        allServices: t("allServices"),
        from: t("from"),
        models: t("models"),
        learnMore: t("learnMore"),
        noServicesFound: t("noServicesFound"),
        popular: t("popular"),
        newest: t("newest"),
        priceAsc: t("priceAsc"),
        priceDesc: t("priceDesc"),
      }}
    />
  )
}
