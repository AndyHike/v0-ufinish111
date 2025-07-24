import { getTranslations } from "next-intl/server"
import SuccessPageClient from "./SuccessPageClient"

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "BookService" })

  return {
    title: t("successTitle"),
    description: t("successDescription"),
  }
}

export default async function BookServiceSuccessPage({ params }: Props) {
  const { locale } = await params
  return <SuccessPageClient locale={locale} />
}
