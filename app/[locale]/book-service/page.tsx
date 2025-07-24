import { getTranslations } from "next-intl/server"
import BookServiceClient from "./book-service-client"

interface Props {
  params: { locale: string }
  searchParams: { service?: string; brand?: string; model?: string; price?: string }
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "BookService" })

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  }
}

export default function BookServicePage({ params, searchParams }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <BookServiceClient
        locale={params.locale}
        service={searchParams.service}
        brand={searchParams.brand}
        model={searchParams.model}
        price={searchParams.price}
      />
    </div>
  )
}
