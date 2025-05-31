"use client"
import { useTranslations } from "next-intl"
import { SeriesList } from "@/components/admin/series-list"

export default function SeriesPage() {
  const t = useTranslations("Admin")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("series") || "Series"}</h1>
        <p className="text-muted-foreground">
          {t("manageSeriesDescription") || "Manage product series for each brand"}
        </p>
      </div>

      <SeriesList />
    </div>
  )
}
