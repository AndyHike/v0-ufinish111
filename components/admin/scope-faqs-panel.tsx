"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Loader2, FileText } from "lucide-react"

// Bulk fill of scope-level FAQs (per model / per series, per service) with the
// model → series → base-service cascade. One CSV row = one FAQ.
export function ScopeFaqsPanel() {
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
      const res = await fetch("/api/admin/scope-faqs/import", { method: "POST", body: fd })
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
        <CardTitle>FAQ на рівні моделі/серії (SEO) — імпорт/експорт</CardTitle>
        <CardDescription>
          Додає FAQ окремо для моделі чи серії в межах послуги. Каскад показу:{" "}
          <code>model → series → базова послуга</code> — найбільш конкретний набір, де є FAQ, виграє цілком (модель
          без FAQ показує FAQ серії, серія без FAQ — базовий FAQ послуги). Один рядок CSV = одне питання. Експорт
          віддає вже наявні FAQ; щоб отримати порожні рядки-заготовки для нової моделі/серії — додай{" "}
          <code>?modelId=</code> / <code>?seriesId=</code> / <code>?brandId=</code> до URL експорту. Колонки:{" "}
          <code>service_slug, scope_type, scope_slug, position, question_{"{cs,en,uk}"}, answer_{"{cs,en,uk}"}</code>.
          Локаль пишеться лише коли заповнені і питання, і відповідь. Порожні рядки ігноруються.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/admin/scope-faqs/export">
              <Download className="mr-2 h-4 w-4" />
              Експорт наявних FAQ (CSV)
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/api/admin/scope-faqs/export?example=1">
              <FileText className="mr-2 h-4 w-4" />
              Завантажити приклад
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
