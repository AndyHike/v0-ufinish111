"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, Download, Edit2, Check } from "lucide-react"
import { RemOnlineImportPreview } from "./remonline-import-preview"
import * as XLSX from "xlsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Brand = {
  id: string
  name: string
  slug: string
}

type Series = {
  id: string
  name: string
  slug: string
  brand_id: string
}

type Model = {
  id: string
  name: string
  slug: string
  brand_id: string
  series_id: string
}

type Service = {
  id: string
  name: string
  slug: string
  description: string
}

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
  parsed_brand?: string
  parsed_series?: string
  parsed_model?: string
  selected_brand_id?: string
  selected_series_id?: string
  selected_model_id?: string
  selected_service_id?: string
  editing?: boolean
}

export function RemOnlineImport() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedServices, setParsedServices] = useState<ParsedService[] | null>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData[] | null>(null)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    setIsLoadingData(true)
    try {
      const [brandsRes, seriesRes, modelsRes, servicesRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/series"),
        fetch("/api/admin/models"),
        fetch("/api/admin/services"),
      ])

      if (brandsRes.ok) setBrands(await brandsRes.json())
      if (seriesRes.ok) setSeries(await seriesRes.json())
      if (modelsRes.ok) setModels(await modelsRes.json())
      if (servicesRes.ok) setServices(await servicesRes.json())
    } catch (error) {
      console.error("Error loading reference data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const parseCategory = (category: string) => {
    const parts = category.split(">").map((part) => part.trim())
    return {
      brand: parts[0] || "",
      series: parts[1] || "",
      model: parts[2] || "",
    }
  }

  const autoMatchReferences = (description: string, category: string) => {
    const { brand: parsedBrand, series: parsedSeries, model: parsedModel } = parseCategory(category)

    // Знаходимо найкращі співпадіння
    const matchedBrand = brands.find(
      (b) =>
        b.name.toLowerCase().includes(parsedBrand.toLowerCase()) ||
        parsedBrand.toLowerCase().includes(b.name.toLowerCase()),
    )

    const matchedSeries = series.find(
      (s) =>
        s.name.toLowerCase().includes(parsedSeries.toLowerCase()) ||
        parsedSeries.toLowerCase().includes(s.name.toLowerCase()),
    )

    const matchedModel = models.find(
      (m) =>
        m.name.toLowerCase().includes(parsedModel.toLowerCase()) ||
        parsedModel.toLowerCase().includes(m.name.toLowerCase()),
    )

    // Знаходимо найкращу послугу за описом
    const matchedService = services.find(
      (s) =>
        description.toLowerCase().includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(description.toLowerCase()) ||
        s.description.toLowerCase().includes(description.toLowerCase()),
    )

    return {
      parsed_brand: parsedBrand,
      parsed_series: parsedSeries,
      parsed_model: parsedModel,
      selected_brand_id: matchedBrand?.id || "",
      selected_series_id: matchedSeries?.id || "",
      selected_model_id: matchedModel?.id || "",
      selected_service_id: matchedService?.id || "",
    }
  }

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

  const parsePrice = (priceStr: string): number | null => {
    if (!priceStr) return null

    // Замінюємо кому на крапку для правильного парсингу
    const cleanPrice = priceStr
      .toString()
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "")
    const parsed = Number.parseFloat(cleanPrice)

    // Перевіряємо чи ціна не занадто мала (можливо помилка парсингу)
    if (isNaN(parsed) || parsed < 0.01) return null

    return Math.round(parsed * 100) / 100 // Округлюємо до 2 знаків після коми
  }

  const parseNumber = (numStr: string): number | null => {
    if (!numStr) return null

    const cleanNum = numStr
      .toString()
      .replace(/,/g, ".")
      .replace(/[^\d.-]/g, "")
    const parsed = Number.parseFloat(cleanNum)

    return isNaN(parsed) ? null : parsed
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

        const parsedPrice = parsePrice(priceStr)
        const parsedDuration = parseNumber(durationStr)
        const parsedWarranty = parseNumber(warranty)

        const autoMatched = autoMatchReferences(description, category)

        return {
          rowIndex: index + 2,
          description,
          category,
          standard_price: parsedPrice,
          warranty,
          warranty_period: warrantyPeriod || "months",
          duration_minutes: parsedDuration,
          // Додаткові поля для сумісності з компонентом передперегляду
          brand_name: "",
          model_name: "",
          service_name: description,
          price: parsedPrice,
          warranty_months: parsedWarranty,
          duration_hours: parsedDuration ? parsedDuration / 60 : null,
          detailed_description: description,
          what_included: "",
          benefits: "",
          original_warranty_duration: warranty,
          original_duration_minutes: durationStr,
          ...autoMatched,
          editing: false,
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
    if (!previewData) {
      toast({
        title: "Помилка",
        description: "Спочатку зробіть передперегляд даних",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          services: previewData.map((item) => ({
            description: item.description,
            category: item.category,
            standard_price: item.standard_price,
            warranty: item.warranty,
            warranty_period: item.warranty_period,
            duration_minutes: item.duration_minutes,
            detailed_description: item.detailed_description,
            what_included: item.what_included,
            benefits: item.benefits,
            selected_brand_id: item.selected_brand_id,
            selected_series_id: item.selected_series_id,
            selected_model_id: item.selected_model_id,
            selected_service_id: item.selected_service_id,
          })),
        }),
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

  const toggleEdit = (index: number) => {
    if (!previewData) return
    const updated = [...previewData]
    updated[index].editing = !updated[index].editing
    setPreviewData(updated)
  }

  const updateSelection = (index: number, field: string, value: string) => {
    if (!previewData) return
    const updated = [...previewData]
    updated[index] = { ...updated[index], [field]: value }
    setPreviewData(updated)
  }

  const getSeriesForBrand = (brandId: string) => {
    return series.filter((s) => s.brand_id === brandId)
  }

  const getModelsForSeries = (seriesId: string) => {
    return models.filter((m) => m.series_id === seriesId)
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
Заміна екрану iPhone 13,Apple &gt; iPhone &gt; iPhone 13,2500,12,months,120
Заміна батареї Samsung Galaxy S21,Samsung &gt; Galaxy S &gt; Galaxy S21,1800,6,months,90
Чистка від вологи iPad Pro,Apple &gt; iPad &gt; iPad Pro,3000,3,months,180`

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
        Бренд: brands.find((b) => b.id === item.selected_brand_id)?.name || item.parsed_brand,
        Серія: series.find((s) => s.id === item.selected_series_id)?.name || item.parsed_series,
        Модель: models.find((m) => m.id === item.selected_model_id)?.name || item.parsed_model,
        Послуга: services.find((s) => s.id === item.selected_service_id)?.name || "Не знайдено",
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
                  <th className="p-2 text-left border-r">Бренд</th>
                  <th className="p-2 text-left border-r">Серія</th>
                  <th className="p-2 text-left border-r">Модель</th>
                  <th className="p-2 text-left border-r">Послуга</th>
                  <th className="p-2 text-left border-r">Ціна</th>
                  <th className="p-2 text-left border-r">Гарантія</th>
                  <th className="p-2 text-left border-r">Тривалість</th>
                  <th className="p-2 text-left">Дії</th>
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
                      <div className="text-xs text-muted-foreground">
                        {item.parsed_brand} → {item.parsed_series} → {item.parsed_model}
                      </div>
                    </td>
                    <td className="p-2 border-r">
                      {item.editing ? (
                        <Select
                          value={item.selected_brand_id}
                          onValueChange={(value) => updateSelection(index, "selected_brand_id", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Оберіть бренд" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          {brands.find((b) => b.id === item.selected_brand_id)?.name || (
                            <span className="text-red-500">Не знайдено</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r">
                      {item.editing ? (
                        <Select
                          value={item.selected_series_id}
                          onValueChange={(value) => updateSelection(index, "selected_series_id", value)}
                          disabled={!item.selected_brand_id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Оберіть серію" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSeriesForBrand(item.selected_brand_id || "").map((serie) => (
                              <SelectItem key={serie.id} value={serie.id}>
                                {serie.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          {series.find((s) => s.id === item.selected_series_id)?.name || (
                            <span className="text-red-500">Не знайдено</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r">
                      {item.editing ? (
                        <Select
                          value={item.selected_model_id}
                          onValueChange={(value) => updateSelection(index, "selected_model_id", value)}
                          disabled={!item.selected_series_id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Оберіть модель" />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsForSeries(item.selected_series_id || "").map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          {models.find((m) => m.id === item.selected_model_id)?.name || (
                            <span className="text-red-500">Не знайдено</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r">
                      {item.editing ? (
                        <Select
                          value={item.selected_service_id}
                          onValueChange={(value) => updateSelection(index, "selected_service_id", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Оберіть послугу" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm">
                          {services.find((s) => s.id === item.selected_service_id)?.name || (
                            <span className="text-red-500">Не знайдено</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="number"
                        step="0.01"
                        value={item.standard_price || ""}
                        onChange={(e) => {
                          const updated = [...previewData]
                          const value = parsePrice(e.target.value)
                          updated[index].standard_price = value
                          updated[index].price = value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                        placeholder="0.00"
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
                          const value = parseNumber(e.target.value)
                          updated[index].warranty_months = value
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                      />
                    </td>
                    <td className="p-2 border-r">
                      <input
                        type="number"
                        value={item.duration_minutes || ""}
                        onChange={(e) => {
                          const updated = [...previewData]
                          const value = parseNumber(e.target.value)
                          updated[index].duration_minutes = value
                          updated[index].original_duration_minutes = e.target.value
                          updated[index].duration_hours = value ? value / 60 : null
                          setPreviewData(updated)
                        }}
                        className="w-full p-1 border rounded text-sm"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-2">
                      <Button size="sm" variant="outline" onClick={() => toggleEdit(index)}>
                        {item.editing ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                      </Button>
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
          Завантажте CSV або Excel файл експорту з RemOnline. Файл повинен містити колонки: Опис, Категорія (у форматі
          "Бренд &gt; Серія &gt; Модель"), Стандартна ціна, Гарантія, Гарантійний період, Тривалість (хвилини).
        </AlertDescription>
      </Alert>

      {isLoadingData && (
        <Alert>
          <AlertDescription>Завантажуються довідники брендів, серій, моделей та послуг...</AlertDescription>
        </Alert>
      )}

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
          <Button onClick={handlePreview} disabled={!file || isProcessing || isLoadingData} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            {isProcessing ? "Завантаження..." : "Передперегляд"}
          </Button>

          <Button onClick={handleProcess} disabled={!previewData || isProcessing}>
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Обробка..." : "Імпортувати"}
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
