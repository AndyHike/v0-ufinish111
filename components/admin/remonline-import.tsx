"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [parsedServices, setParsedServices] = useState<ParsedService[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, виберіть CSV файл",
          variant: "destructive",
        })
      }
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
        setShowPreview(true)
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
    setShowPreview(false)
    setParsedServices([])
    setSummary(null)
    setFile(null)
  }

  const handleSuccess = () => {
    setShowPreview(false)
    setParsedServices([])
    setSummary(null)
    setFile(null)
    toast({
      title: "Успіх",
      description: "Імпорт завершено успішно",
    })
  }

  if (showPreview) {
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
        <h2 className="text-2xl font-bold mb-2">Імпорт з RemOnline</h2>
        <p className="text-muted-foreground">
          Завантажте CSV файл експорту з RemOnline для автоматичного імпорту послуг
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Завантаження файлу
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV файл з RemOnline</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="mt-1" />
          </div>

          {file && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            </div>
          )}

          <Button onClick={processFile} disabled={!file || isProcessing} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка..." : "Обробити файл"}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Формат файлу:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Колонка "Опис" повинна містити slug в квадратних дужках: [screen-replacement]</li>
            <li>
              • Колонка "Категорія" повинна містити ієрархію: Apple {">"} iPhone {">"} iPhone 11
            </li>
            <li>• Колонки "Стандартна ціна", "Гарантія", "Гарантійний період", "Тривалість"</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
