import { getTranslations } from "next-intl/server"
import StandaloneBookingClient from "./standalone-booking-client"

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params
  const t = await getTranslations({ locale: resolvedParams.locale, namespace: "StandaloneBooking" })

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    robots: { index: false, follow: false },
  }
}

export default async function StandaloneBookingPage({ params }: Props) {
  const resolvedParams = await params
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StandaloneBookingClient locale={resolvedParams.locale} />
    </div>
  )
}
