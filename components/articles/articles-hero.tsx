"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"

export function ArticlesHero({ locale, search }: { locale: string; search?: string }) {
  const t = useTranslations("Articles")

  return (
    <div className="max-w-2xl mx-auto text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        {t("title")}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {t("subtitle")}
      </p>

      {/* Search */}
      <div className="relative">
        <form action="" method="get" className="flex gap-2">
          <Input
            type="search"
            name="search"
            placeholder={t("searchPlaceholder")}
            defaultValue={search || ""}
            className="flex-1"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t("searchButton")}
          </button>
        </form>
      </div>
    </div>
  )
}
