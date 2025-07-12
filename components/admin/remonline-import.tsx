"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, AlertCircle } from "lucide-react"
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
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedServices, setParsedServices] = useState<ParsedService[] | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Помилка",
          description: "Будь ласка, виберіть CSV файл",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setParsedServices(null)
      setSummary(null)
    }
  }

  const processFile = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть файл",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const csvData = await file.text()

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
          description: `Оброблено ${result.total} записів`,
        })
      } else {
        throw new Error(result.error || "Failed to process file")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося обробити файл",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    setParsedServices(null)
    setSummary(null)
    setFile(null)
  }

  const handleSuccess = () => {
    setParsedServices(null)
    setSummary(null)
    setFile(null)
    toast({
      title: "Успіх",
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
      <div>
        <h2 className="text-2xl font-bold">Імпорт з RemOnline</h2>
        <p className="text-muted-foreground">
          Завантажте CSV файл експорту з RemOnline для автоматичного імпорту послуг
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Формат файлу
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Очікувані колонки в CSV файлі:</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <strong>Опис</strong> - містить [slug] послуги в квадратних дужках
              </li>
              <li>
                <strong>Категорія</strong> - ієрархія "Бренд {">"} Серія {">"} Модель"
              </li>
              <li>
                <strong>Стандартна ціна</strong> - ціна послуги
              </li>
              <li>
                <strong>Гарантія</strong> - тривалість гарантії (число)
              </li>
              <li>
                <strong>Гарантійний період</strong> - метрика (міс. або дн.)
              </li>
              <li>
                <strong>Тривалість (хвилини)</strong> - час виконання в хвилинах
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Важливо</h4>
                <p className="text-sm text-yellow-700">
                  Система автоматично співставить дані з вашою базою. Якщо модель не знайдена - буде запропоновано
                  створити нову.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Завантаження файлу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV файл з RemOnline</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="mt-1" />
          </div>

          {file && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                Файл вибрано: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            </div>
          )}

          <Button onClick={processFile} disabled={!file || isProcessing} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка файлу..." : "Обробити файл"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
