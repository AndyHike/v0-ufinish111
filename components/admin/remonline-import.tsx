"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { FileText, FileSpreadsheet, Eye } from "lucide-react"
import { RemOnlineImportPreview } from "./remonline-import-preview"

interface ImportData {
  rowIndex: number
  brand_name: string
  model_name: string
  service_name: string
  price: number | null
  warranty_months: number | null
  duration_hours: number | null
  warranty_period: string
  detailed_description: string
  what_included: string
  benefits: string
  original_warranty_duration: string
  original_duration_minutes: string
}

export function RemOnlineImport() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewData, setPreviewData] = useState<ImportData[] | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const fileExtension = selectedFile.name.toLowerCase()
      const isValidFile =
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".csv") ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel" ||
        fileExtension.endsWith(".xlsx") ||
        fileExtension.endsWith(".xls")

      if (isValidFile) {
        setFile(selectedFile)
        setPreviewData(null)
        setShowPreview(false)
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть CSV або Excel файл (.csv, .xlsx, .xls)",
          variant: "destructive",
        })
      }
    }
  }

  const handlePreview = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть файл для перегляду",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("preview", "true")

      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setPreviewData(result.data)
        setShowPreview(true)
        toast({
          title: "Успіх",
          description: `Завантажено ${result.totalRows} записів для перегляду`,
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

  const handleImport = async (data: ImportData[]) => {
    try {
      const response = await fetch("/api/admin/bulk-import/remonline-services/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (response.ok) {
        return result.results
      } else {
        throw new Error(result.error || "Помилка імпорту")
      }
    } catch (error) {
      console.error("Import error:", error)
      throw error
    }
  }

  const handleBack = () => {
    setShowPreview(false)
    setPreviewData(null)
  }

  const handleSuccess = () => {
    setFile(null)
    setPreviewData(null)
    setShowPreview(false)
    // Reset file input
    const fileInput = document.getElementById("remonline-file-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase()
    if (extension.endsWith(".csv")) {
      return <FileText className="h-4 w-4" />
    }
    return <FileSpreadsheet className="h-4 w-4" />
  }

  const getFileTypeText = (fileName: string) => {
    const extension = fileName.toLowerCase()
    if (extension.endsWith(".csv")) return "CSV файл"
    if (extension.endsWith(".xlsx")) return "Excel файл (XLSX)"
    if (extension.endsWith(".xls")) return "Excel файл (XLS)"
    return "Файл"
  }

  // Show preview if we have data
  if (showPreview && previewData) {
    return <RemOnlineImportPreview data={previewData} onImport={handleImport} onCancel={handleBack} />
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          Завантажте CSV або Excel файл експорту з RemOnline. Файл повинен містити колонки: brand_name, model_name,
          service_name, price, warranty_duration, warranty_period, duration_minutes, detailed_description,
          what_included, benefits.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="remonline-file-upload">Оберіть файл з RemOnline</Label>
          <Input
            id="remonline-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileChange}
            className="mt-2"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {getFileIcon(file.name)}
            <div className="flex-1">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground">
                {getFileTypeText(file.name)} • {Math.round(file.size / 1024)} KB
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handlePreview}
            disabled={!file || isProcessing}
            variant="outline"
            className="flex-1 bg-transparent"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка..." : "Переглянути дані"}
          </Button>
        </div>

        {!showPreview && (
          <Alert>
            <AlertDescription>
              <strong>Підтримувані формати:</strong>
              <ul className="mt-2 space-y-1">
                <li>• CSV файли (.csv)</li>
                <li>• Excel файли (.xlsx, .xls)</li>
              </ul>
              <div className="mt-3">
                <strong>Рекомендації:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Переконайтеся що перший рядок містить заголовки колонок</li>
                  <li>• Використовуйте UTF-8 кодування для CSV файлів</li>
                  <li>• Перевірте що всі обов'язкові колонки присутні</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
