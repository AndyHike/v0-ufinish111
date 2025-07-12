"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, AlertCircle, FileSpreadsheet, Download, X, Eye } from "lucide-react"
import Papa from "papaparse"
import { RemOnlineImportPreview } from "./remonline-import-preview"

type ParsedService = {
  id: string
  slug: string | null
  brand: string | null
  series: string | null
  model: string | null
  price: number | null
  warranty_duration: number | null
  warranty_period: "months" | "days" | null
  duration_minutes: number | null
  original_description: string
  original_category: string
  service_found: boolean
  brand_found: boolean
  series_found: boolean
  model_found: boolean
  service_id: string | null
  brand_id: string | null
  series_id: string | null
  model_id: string | null
  errors: string[]
}

type ImportSummary = {
  total: number
  with_errors: number
  services_found: number
  brands_found: number
  series_found: number
  models_found: number
}

interface RemOnlineImportProps {
  onSuccess?: () => void
}

export function RemOnlineImport({ onSuccess }: RemOnlineImportProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedServices, setParsedServices] = useState<ParsedService[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Підтримуються тільки CSV файли")
      return
    }

    setFile(selectedFile)
    setError(null)
    setParsedServices([])
    setSummary(null)
    setShowPreview(false)
  }

  async function handleProcessFile() {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      // Read file as text
      const fileText = await file.text()

      // Send to API for processing
      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: fileText }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to process file")
      }

      setParsedServices(result.services)
      setSummary(result.summary)
      setShowPreview(true)

      toast({
        title: "Файл оброблено",
        description: `Знайдено ${result.total} послуг для імпорту`,
      })
    } catch (err) {
      console.error("Error processing file:", err)
      setError(err instanceof Error ? err.message : "Помилка обробки файлу")
      toast({
        title: "Помилка",
        description: "Не вдалося обробити файл",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadTemplate() {
    const template = [
      {
        Опис: "Заміна екрану [screen-replacement] для iPhone",
        Категорія: "Apple &gt; iPhone &gt; iPhone 13",
        "Стандартна ціна": "2500",
        Гарантія: "6",
        "Гарантійний період": "міс.",
        Тривалість: "120",
      },
      {
        Опис: "Заміна батареї [battery-replacement] для Samsung",
        Категорія: "Samsung &gt; Galaxy S &gt; Galaxy S21",
        "Стандартна ціна": "1200",
        Гарантія: "3",
        "Гарантійний період": "міс.",
        Тривалість: "60",
      },
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "remonline_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleImportSuccess() {
    setFile(null)
    setParsedServices([])
    setSummary(null)
    setShowPreview(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (onSuccess) onSuccess()
  }

  if (showPreview && parsedServices.length > 0) {
    return (
      <RemOnlineImportPreview
        services={parsedServices}
        summary={summary}
        onBack={() => setShowPreview(false)}
        onSuccess={handleImportSuccess}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Імпорт з RemOnline</h3>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <Download className="mr-2 h-4 w-4" />
          Завантажити шаблон
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Помилка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

            {!file ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">Завантажте CSV файл з RemOnline</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Файл повинен містити колонки: Опис, Категорія, Стандартна ціна, Гарантія, Гарантійний період,
                  Тривалість
                </p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4">
                  Вибрати файл
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null)
                      setParsedServices([])
                      setSummary(null)
                      setShowPreview(false)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={handleProcessFile} disabled={isProcessing} className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  {isProcessing ? "Обробка..." : "Обробити та переглянути"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Формат файлу</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
            <li>
              <strong>Опис:</strong> Повинен містити slug в квадратних дужках, наприклад: "Заміна екрану
              [screen-replacement]"
            </li>
            <li>
              <strong>Категорія:</strong> Ієрархія через " &gt; ", наприклад: "Apple &gt; iPhone &gt; iPhone 13"
            </li>
            <li>
              <strong>Стандартна ціна:</strong> Ціна в гривнях
            </li>
            <li>
              <strong>Гарантія:</strong> Число (тривалість гарантії)
            </li>
            <li>
              <strong>Гарантійний період:</strong> "міс." або "дн."
            </li>
            <li>
              <strong>Тривалість:</strong> Час виконання в хвилинах
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
