import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import BookingPageClient from "./booking-page-client"
import { PageHeader } from "@/components/page-header"

export default async function BookingPage() {
  const t = await getTranslations("booking")

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <BookingPageClient />
        </Suspense>
      </div>
    </div>
  )
}
