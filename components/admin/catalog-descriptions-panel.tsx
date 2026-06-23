"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Loader2 } from "lucide-react"

// Bulk fill of unique per-locale PAGE descriptions (intro + optional longer body)
// for catalog pages (brand / series / model) into catalog_descriptions.
export function CatalogDescriptionsPanel() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ upserted: number; skipped: number; errors: number; errorMessages?: string[] } | null>(null)

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/catalog-descriptions/import", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")
      setResult(data)
      toast({
        title: "Імпорт завершено",
        description: `Оновлено: ${data.upserted} · Пропущено: ${data.skipped} · Помилок: ${data.errors}`,
      })
    } catch (e) {
      toast({
        title: "Помилка імпорту",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Унікальні описи сторінок серій/моделей (SEO) — імпорт/експорт</CardTitle>
        <CardDescription>
          Додає унікальний опис самій сторінці бренду/серії/моделі (а не послузі). Каскад:{" "}
          <code>model → series → brand</code> — модель без опису бере опис серії, серія — бренду. Експорт шаблону за
          замовчуванням містить бренди + серії; щоб додати моделі — додай{" "}
          <code>?seriesId=</code> / <code>?brandId=</code> / <code>?modelId=</code> до URL експорту. Заповни колонки{" "}
          <code>description_{"{cs,en,uk}"}</code> (короткий вступ під H1) та опційно{" "}
          <code>body_{"{cs,en,uk}"}</code> (довший унікальний блок) і завантаж назад. Порожні рядки ігноруються
          (нічого не видаляється).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/admin/catalog-descriptions/export">
              <Download className="mr-2 h-4 w-4" />
              Експорт шаблону (бренди + серії)
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm file:mr-2 file:rounded file:border file:bg-muted file:px-3 file:py-1"
          />
          <Button onClick={handleImport} disabled={!file || importing}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Імпортувати
          </Button>
        </div>

        {result && (
          <div className="text-sm text-muted-foreground">
            Оновлено: <strong>{result.upserted}</strong> · Пропущено: <strong>{result.skipped}</strong> · Помилок:{" "}
            <strong>{result.errors}</strong>
            {result.errorMessages && result.errorMessages.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-red-600">
                {result.errorMessages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
