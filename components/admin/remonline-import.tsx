"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, Download } from "lucide-react"
import { RemOnlineImportPreview } from "./remonline-import-preview"
import * as XLSX from "xlsx"

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

type PreviewData = {
  rowIndex: number
  description: string
  category: string
  standard_price: number | null
  warranty: string
  warranty_period: string
  duration_minutes: number | null
  brand_name?: string
  model_name?: string
  service_name?: string
  price?: number | null
  warranty_months?: number | null
  duration_hours?: number | null
  detailed_description?: string
  what_included?: string
  benefits?: string
  original_warranty_duration?: string
  original_duration_minutes?: string
}

export function RemOnlineImport() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedServices, setParsedServices] = useState<ParsedService[] | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData[] | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const isCSV = selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")
      const isExcel =
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls") ||
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"

      if (isCSV || isExcel) {
        setFile(selectedFile)
        // Reset previous results
        setParsedServices(null)
        setImportSummary(null)
        setPreviewData(null)
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть CSV або Excel файл",
          variant: "destructive",
        })
      }
    }
  }

  const parseExcelFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const csvData = XLSX.utils.sheet_to_csv(worksheet)
          resolve(csvData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error("Помилка читання файлу"))
      reader.readAsArrayBuffer(file)
    })
  }

  const handlePreview = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть файл для передперегляду",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      let fileContent: string

      // Визначаємо тип файлу та парсимо відповідно
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        fileContent = await parseExcelFile(file)
      } else {
        fileContent = await file.text()
      }

      // Парсимо CSV дані
      const lines = fileContent.split("\n").filter((line) => line.trim())
      if (lines.length < 2) {
        throw new Error("Файл повинен містити принаймні заголовок та один рядок даних")
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      // Перевіряємо наявність обов'язкових колонок для RemOnline
      const requiredColumns = ["Опис", "Категорія", "Стандартна ціна"]
      const missingColumns = requiredColumns.filter(
        (col) => !headers.some((header) => header.toLowerCase().includes(col.toLowerCase())),
      )

      if (missingColumns.length > 0) {
        throw new Error(`Відсутні обов'язкові колонки: ${missingColumns.join(", ")}`)
      }

      // Парсимо дані
      const data: PreviewData[] = lines.slice(1).map((line, index) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: any = {}

        headers.forEach((header, i) => {
          row[header] = values[i] || ""
        })

        // Знаходимо відповідні колонки (гнучкий пошук)
        const getColumnValue = (searchTerms: string[]) => {
          for (const term of searchTerms) {
            const header = headers.find((h) => h.toLowerCase().includes(term.toLowerCase()))
            if (header && row[header]) return row[header]
          }
          return ""
        }

        const description = getColumnValue(["опис", "description", "назва", "name"])
        const category = getColumnValue(["категорія", "category"])
        const priceStr = getColumnValue(["стандартна ціна", "ціна", "price", "standard price"])
        const warranty = getColumnValue(["гарантія", "warranty"])
        const warrantyPeriod = getColumnValue(["гарантійний період", "warranty period", "період"])
        const durationStr = getColumnValue(["тривалість", "duration", "хвилини", "minutes"])

        return {
          rowIndex: index + 2,
          description,
          category,
          standard_price: priceStr ? Number.parseFloat(priceStr) : null,
          warranty,
          warranty_period: warrantyPeriod || "months",
          duration_minutes: durationStr ? Number.parseFloat(durationStr) : null,
          // Додаткові поля для сумісності з компонентом передперегляду
          brand_name: "",
          model_name: "",
          service_name: description,
          price: priceStr ? Number.parseFloat(priceStr) : null,
          warranty_months: warranty ? Number.parseFloat(warranty) : null,
          duration_hours: durationStr ? Number.parseFloat(durationStr) / 60 : null,
          detailed_description: description,
          what_included: "",
          benefits: "",
          original_warranty_duration: warranty,
          original_duration_minutes: durationStr,
        }
      })

      setPreviewData(data)
      toast({
        title: "Успіх",
        description: `Завантажено ${data.length} записів для передперегляду`,
      })
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
      let fileContent: string

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        fileContent = await parseExcelFile(file)
      } else {
        fileContent = await file.text()
      }

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
    setPreviewData(null)
  }

  const handleSuccess = () => {
    setFile(null)
    setParsedServices(null)
    setImportSummary(null)
    setPreviewData(null)
    // Reset file input
    const fileInput = document.getElementById("remonline-file-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const downloadTemplate = () => {
    const csvContent = `Опис,Категорія,Стандартна ціна,Гарантія,Гарантійний період,Тривалість (хвилини)
Заміна екрану iPhone 13,Ремонт екранів,2500,12,months,120
Заміна батареї Samsung Galaxy S21,Заміна батарей,1800,6,months,90
Чистка від вологи iPad Pro,Відновлення після потрапляння вологи,3000,3,months,180`

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "remonline_services_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportToExcel = () => {
    if (!previewData) return

    const worksheet = XLSX.utils.json_to_sheet(
      previewData.map((item) => ({
        Рядок: item.rowIndex,
        Опис: item.description,
        Категорія: item.category,
        "Стандартна ціна": item.standard_price,
        Гарантія: item.warranty,
        "Гарантійний період": item.warranty_period,
        "Тривалість (хвилини)": item.duration_minutes,
      })),
    )

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "RemOnline Services")
    XLSX.writeFile(workbook, "remonline_services_preview.xlsx")
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

  if (previewData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Передперегляд даних ({previewData.length} записів)</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Експорт Excel
            </Button>
            <Button onClick={handleProcess} disabled={isProcessing}>
              {isProcessing ? "Обробка..." : "Імпортувати"}
            </Button>
            <Button variant="outline" onClick={handleBack}>
              Назад
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left border-r">№</th>
                  <th className="p-2 text-left border-r">Опис</th>
                  <th className="p-2 text-left border-r">Категорія</th>
                  <th className="p-2 text-left border-r">Ціна</th>
                  <th className="p-2 text-left border-r">Гарантія</th>
                  <th className="p-2 text-left border-r">Період</th>
                  <th className="p-2 text-left">Тривалість (хв)</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 border-r font-mono text-xs">{item.rowIndex}</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...previewData]
                          updated[index].description = e.target.value
                          updated[index].service_name = e.target.value
                          updated[index].detailed_description = e.target.value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => {
                          const updated = [...previewData]
                          updated[index].category = e.target.value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="number"
                        value={item.standard_price || ""}
                        onChange={(e) => {
                          const updated = [...previewData]
                          const value = e.target.value ? Number.parseFloat(e.target.value) : null
                          updated[index].standard_price = value
                          updated[index].price = value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={item.warranty}
                        onChange={(e) => {
                          const updated = [...previewData]
                          updated[index].warranty = e.target.value
                          updated[index].original_warranty_duration = e.target.value
                          const value = e.target.value ? Number.parseFloat(e.target.value) : null
                          updated[index].warranty_months = value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <select
                        value={item.warranty_period}
                        onChange={(e) => {
                          const updated = [...previewData]
                          updated[index].warranty_period = e.target.value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                      >
                        <option value="months">Місяці</option>
                        <option value="days">Дні</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.duration_minutes || ""}
                        onChange={(e) => {
                          const updated = [...previewData]
                          const value = e.target.value ? Number.parseFloat(e.target.value) : null
                          updated[index].duration_minutes = value
                          updated[index].original_duration_minutes = e.target.value
                          updated[index].duration_hours = value ? value / 60 : null
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Завантажте CSV або Excel файл експорту з RemOnline. Файл повинен містити колонки: Опис, Категорія, Стандартна
          ціна, Гарантія, Гарантійний період, Тривалість (хвилини).
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="remonline-file-upload">Оберіть CSV або Excel файл з RemOnline</Label>
          <Input
            id="remonline-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="mt-2"
          />
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Обраний файл: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handlePreview} disabled={!file || isProcessing} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            {isProcessing ? "Завантаження..." : "Передперегляд"}
          </Button>

          <Button onClick={handleProcess} disabled={!file || isProcessing}>
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка..." : "Обробити файл"}
          </Button>

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Завантажити шаблон
          </Button>
        </div>
      </div>
    </div>
  )
}
