import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ServicePageClient } from "./service-page-client"

interface ServicePageProps {
  params: {
    locale: string
    slug: string
  }
}

async function getService(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services/${slug}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching service:", error)
    return null
  }
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const service = await getService(params.slug)

  if (!service) {
    return {
      title: "Service Not Found",
    }
  }

  const description = service.service_descriptions?.find((desc: any) => desc.language === params.locale)

  return {
    title: description?.name || service.name,
    description: description?.description || service.description,
    openGraph: {
      title: description?.name || service.name,
      description: description?.description || service.description,
      type: "website",
    },
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const service = await getService(params.slug)

  if (!service) {
    notFound()
  }

  const t = await getTranslations("Services")

  return (
    <ServicePageClient
      service={service}
      locale={params.locale}
      translations={{
        title: t("title"),
        description: t("description"),
        price: t("price"),
        models: t("models"),
        process: t("process"),
        contact: t("contact"),
        selectModel: t("selectModel"),
        from: t("from"),
        to: t("to"),
        average: t("average"),
        availableFor: t("availableFor"),
        devicesSupported: t("devicesSupported"),
        requestService: t("requestService"),
        viewAllModels: t("viewAllModels"),
        serviceProcess: t("serviceProcess"),
        whyChooseUs: t("whyChooseUs"),
        qualityGuarantee: t("qualityGuarantee"),
        fastService: t("fastService"),
        expertTechnicians: t("expertTechnicians"),
      }}
    />
  )
}
