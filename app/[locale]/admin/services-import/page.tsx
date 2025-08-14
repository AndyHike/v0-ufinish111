import type { Metadata } from "next"
import { ServicesImport } from "@/components/admin/services-import"

export const metadata: Metadata = {
  title: "Імпорт послуг",
  description: "Імпорт послуг з CSV/Excel файлів",
}

export default function ServicesImportPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Імпорт послуг</h1>
        <p className="text-muted-foreground mt-2">Завантажте CSV або Excel файл для імпорту послуг</p>
      </div>
      <ServicesImport />
    </div>
  )
}
