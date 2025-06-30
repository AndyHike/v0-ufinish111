import { getTranslations } from "next-intl/server"
import { ServicesPageClient } from "./services-page-client"

interface ServicesPageProps {
  params: {
    locale: string
  }
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const t = await getTranslations("Services")

  return (
    <ServicesPageClient
      locale={params.locale}
      translations={{
        title: t("title"),
        subtitle: t("subtitle"),
        allServices: t("allServices"),
        selectService: t("selectService"),
        learnMore: t("learnMore"),
        from: t("from"),
        modelsSupported: t("modelsSupported"),
      }}
    />
  )
}
