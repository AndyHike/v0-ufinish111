import type { Metadata } from "next"
import { ImportExport } from "@/components/admin/import-export"

export const metadata: Metadata = {
  title: "Імпорт/Експорт",
  description: "Масовий імпорт та експорт даних (бренди, серії, моделі, послуги)",
}

export default function ImportExportPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Імпорт/Експорт даних</h1>
        <p className="text-muted-foreground mt-2">Масовий імпорт та експорт даних: бренди, серії, моделі, послуги</p>
      </div>
      <ImportExport />
    </div>
  )
}
