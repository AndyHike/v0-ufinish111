import { getTranslations } from "next-intl/server"
import StandaloneBookingClient from "./standalone-booking-client"

interface Props {
  params: { locale: string }
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "StandaloneBooking" })

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  }
}

export default function StandaloneBookingPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StandaloneBookingClient locale={params.locale} />
    </div>
  )
}
