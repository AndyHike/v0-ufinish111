import { getTranslations } from "next-intl/server"
import SuccessPageClient from "./SuccessPageClient"

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "BookService" })

  return {
    title: t("successTitle"),
    description: t("successMessage"),
  }
}

export default function BookServiceSuccessPage({ params }: Props) {
  return <SuccessPageClient params={params} />
}
