import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import BookServiceClient from "./book-service-client"

export default async function BookServicePage() {
  const t = await getTranslations("BookService")

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>

          <Suspense
            fallback={
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                </div>
              </div>
            }
          >
            <BookServiceClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
