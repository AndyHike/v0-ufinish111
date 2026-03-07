import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import BookingConfirmClient from "./booking-confirm-client"

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
    const resolvedParams = await params
    const t = await getTranslations({ locale: resolvedParams.locale, namespace: "StandaloneBooking" })

    return {
        title: t("confirmBooking") || "Confirm Booking",
        description: t("confirmBookingDesc") || "Confirm your service booking details.",
        robots: { index: false, follow: false },
    }
}

export default async function BookingConfirmPage({ params }: Props) {
    const resolvedParams = await params

    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <BookingConfirmClient locale={resolvedParams.locale} />
            </Suspense>
        </div>
    )
}
