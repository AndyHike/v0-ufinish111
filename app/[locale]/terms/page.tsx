"use client"

import { useTranslations } from "next-intl"

export default function TermsPage() {
  const t = useTranslations("Terms")

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
      </div>

      <div className="prose prose-sm sm:prose lg:prose-lg mx-auto">
        {/* Контент буде додано пізніше */}
        <p>{t("contentPlaceholder")}</p>
      </div>
    </div>
  )
}
