"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Loader2, FileText } from "lucide-react"

// Bulk fill of unique per-locale page texts (detailed_description / what_included /
// benefits) into service_scope_translations. Isolated from the legacy multi-entity
// importer on purpose.
export function ScopeTranslationsPanel() {
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
      const res = await fetch("/api/admin/scope-translations/import", { method: "POST", body: fd })
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
        <CardTitle>Унікальні описи (SEO) — мультимовний імпорт/експорт</CardTitle>
        <CardDescription>
          Експортуй шаблон (усі комбінації модель×послуга з уже заповненими описами), додай унікальні тексти в
          колонки <code>detailed_description / what_included / benefits</code> на 3 мови (cs/en/uk) і завантаж назад.
          Порожні рядки ігноруються (нічого не видаляється). <code>scope_type</code>: <code>model</code> або{" "}
          <code>series</code>; <code>scope_slug</code> — слаг моделі/серії.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/admin/scope-translations/export">
              <Download className="mr-2 h-4 w-4" />
              Експорт шаблону (CSV)
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/api/admin/scope-translations/export?example=1">
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
