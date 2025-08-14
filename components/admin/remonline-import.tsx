"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText } from "lucide-react"
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
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
        // Reset previous results
        setParsedServices(null)
        setImportSummary(null)
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть CSV файл",
          variant: "destructive",
        })
      }
    }
  }

  const handleProcess = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть файл для обробки",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Read file content
      const fileContent = await file.text()

      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData: fileContent }),
      })

      const result = await response.json()

      if (response.ok) {
        setParsedServices(result.services)
        setImportSummary(result.summary)
        toast({
          title: "Успіх",
          description: `Оброблено ${result.total} записів`,
        })
      } else {
        throw new Error(result.error || "Помилка обробки файлу")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Помилка обробки файлу",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = () => {
    setParsedServices(null)
    setImportSummary(null)
  }

  const handleSuccess = () => {
    setFile(null)
    setParsedServices(null)
    setImportSummary(null)
    // Reset file input
    const fileInput = document.getElementById("remonline-file-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  // Show preview if we have parsed services
  if (parsedServices) {
    return (
      <RemOnlineImportPreview
        services={parsedServices}
        summary={importSummary}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Завантажте CSV файл експорту з RemOnline. Файл повинен містити колонки: Опис, Категорія, Стандартна ціна,
          Гарантія, Гарантійний період, Тривалість (хвилини).
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="remonline-file-upload">Оберіть CSV файл з RemOnline</Label>
          <Input id="remonline-file-upload" type="file" accept=".csv" onChange={handleFileChange} className="mt-2" />
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Обраний файл: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleProcess} disabled={!file || isProcessing}>
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка..." : "Обробити файл"}
          </Button>
        </div>
      </div>
    </div>
  )
}
