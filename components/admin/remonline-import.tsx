"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload } from "lucide-react"
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
  needs_new_model: boolean
  suggested_model_name: string | null
}

type ImportSummary = {
  total: number
  with_errors: number
  services_found: number
  brands_found: number
  series_found: number
  models_found: number
  new_models_needed: number
}

export function RemOnlineImport() {
  const { toast } = useToast()
  const [csvData, setCsvData] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedServices, setParsedServices] = useState<ParsedService[] | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть CSV файл",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file, "UTF-8")
  }

  const processImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Помилка",
        description: "Будь ласка, завантажте CSV файл або введіть дані",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData }),
      })

      const result = await response.json()

      if (response.ok) {
        setParsedServices(result.services)
        setSummary(result.summary)
        toast({
          title: "Успіх",
          description: `Оброблено ${result.total} послуг`,
        })
      } else {
        throw new Error(result.error || "Failed to process import")
      }
    } catch (error) {
      console.error("Error processing import:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося обробити імпорт",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    setParsedServices(null)
    setSummary(null)
  }

  const handleSuccess = () => {
    setParsedServices(null)
    setSummary(null)
    setCsvData("")
    toast({
      title: "Готово",
      description: "Імпорт завершено успішно",
    })
  }

  if (parsedServices) {
    return (
      <RemOnlineImportPreview
        services={parsedServices}
        summary={summary}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Імпорт з RemOnline експорту</h3>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Формат файлу</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            • <strong>Опис:</strong> містить [slug] в квадратних дужках
          </p>
          <p>
            • <strong>Категорія:</strong> ієрархія через &quot;&gt;&quot; (Apple &gt; iPhone &gt; iPhone 13)
          </p>
          <p>
            • <strong>Стандартна ціна:</strong> ціна послуги
          </p>
          <p>
            • <strong>Гарантія:</strong> тривалість гарантії
          </p>
          <p>
            • <strong>Гарантійний період:</strong> міс. або дн.
          </p>
          <p>
            • <strong>Тривалість (хвилини):</strong> час виконання
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Завантажити CSV файл з RemOnline</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="csv-data">Або вставити CSV дані</Label>
          <Textarea
            id="csv-data"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Опис,Категорія,Стандартна ціна,Гарантія,Гарантійний період,Тривалість (хвилини)"
            rows={10}
            className="mt-1 font-mono text-sm"
          />
        </div>

        <Button onClick={processImport} disabled={isProcessing || !csvData.trim()}>
          <Upload className="h-4 w-4 mr-2" />
          {isProcessing ? "Обробка..." : "Обробити"}
        </Button>
      </div>
    </div>
  )
}
