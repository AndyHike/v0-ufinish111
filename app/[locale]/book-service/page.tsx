"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import BookServiceClient from "./book-service-client"

export default function BookServicePage() {
  const t = useTranslations("BookService")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">{t("loading")}</span>
            </div>
          }
        >
          <BookServiceClient />
        </Suspense>
      </div>
    </div>
  )
}
