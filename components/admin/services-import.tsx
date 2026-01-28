"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, AlertCircle, CheckCircle, X, Edit2, Download } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

interface ServiceData {
  id: string
  description: string
  category: string
  price: string
  warranty: string
  warrantyPeriod: string
  duration: string
  brandName?: string
  seriesName?: string
  modelName?: string
  brandId?: string
  seriesId?: string
  modelId?: string
  serviceId?: string
  status: "valid" | "warning" | "error"
  errors: string[]
  missingBrand?: boolean
  missingSeries?: boolean
  missingModel?: boolean
  createMissing?: boolean
}

interface Brand {
  id: string
  name: string
  slug: string
}

interface Series {
  id: string
  name: string
  slug: string
  brand_id: string
}

interface Model {
  id: string
  name: string
  slug: string
  brand_id: string
  series_id: string
}

interface Service {
  id: string
  name: string
  slug: string
  description: string
}

export function ServicesImport() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<ServiceData[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [editingRow, setEditingRow] = useState<string | null>(null)

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Safe array helper
  const safeArray = <T,>(arr: T[] | undefined | null): T[] => {
    return Array.isArray(arr) ? arr : []
  }

  // Safe find helper
  const safeFindInArray = <T extends { id: string; name: string }>(
    items: T[] | undefined | null,
    predicate: (item: T) => boolean,
  ): T | undefined => {
    const safeItems = safeArray(items)
    return safeItems.find(predicate)
  }

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = useCallback(async () => {
    try {
      console.log("Loading reference data...")

      const [brandsRes, seriesRes, modelsRes, servicesRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/series"),
        fetch("/api/admin/models"),
        fetch("/api/admin/services"),
      ])

      if (!brandsRes.ok || !seriesRes.ok || !modelsRes.ok || !servicesRes.ok) {
        throw new Error("Failed to fetch reference data")
      }

      const [brandsData, seriesData, modelsData, servicesData] = await Promise.all([
        brandsRes.json(),
        seriesRes.json(),
        modelsRes.json(),
        servicesRes.json(),
      ])

      setBrands(Array.isArray(brandsData.brands) ? brandsData.brands : Array.isArray(brandsData) ? brandsData : [])
      setSeries(Array.isArray(seriesData.series) ? seriesData.series : Array.isArray(seriesData) ? seriesData : [])
      setModels(Array.isArray(modelsData.models) ? modelsData.models : Array.isArray(modelsData) ? modelsData : [])
      setServices(
        Array.isArray(servicesData.services) ? servicesData.services : Array.isArray(servicesData) ? servicesData : [],
      )
      setDataLoaded(true)

      console.log("Reference data loaded successfully:")
      console.log("Brands:", brandsData)
      console.log("Series:", seriesData)
      console.log("Models:", modelsData)
      console.log("Services:", servicesData)
    } catch (error) {
      console.error("Error loading reference data:", error)
      setBrands([])
      setSeries([])
      setModels([])
      setServices([])
      setDataLoaded(true)
    }
  }, [])

  const parseCategory = (category: string) => {
    if (!category || typeof category !== "string") {
      return { brandName: "", seriesName: "", modelName: "" }
    }

    const parts = category.split(">").map((part) => part.trim())
    return {
      brandName: parts[0] || "",
      seriesName: parts[1] || "",
      modelName: parts[2] || "",
    }
  }

  const findBestMatch = (name: string, items: any[]): any | null => {
    if (!name || typeof name !== "string") return null
    const safeItems = safeArray(items)
    if (safeItems.length === 0) return null

    const normalizedName = name.toLowerCase().trim()

    // Спочатку шукаємо точні співпадіння
    const exactMatch = safeItems.find((item) => {
      if (!item || !item.name) return false
      const itemName = item.name.toLowerCase().trim()
      const itemSlug = item.slug ? item.slug.toLowerCase().trim() : ""

      return itemName === normalizedName || itemSlug === normalizedName
    })

    if (exactMatch) {
      console.log(`Exact match found for "${name}":`, exactMatch.name)
      return exactMatch
    }

    // Якщо точного співпадіння немає, шукаємо часткові співпадіння
    // але тільки якщо назва з файлу ПОВНІСТЮ міститься в назві з БД
    const partialMatch = safeItems.find((item) => {
      if (!item || !item.name) return false
      const itemName = item.name.toLowerCase().trim()

      // Перевіряємо чи назва з БД містить назву з файлу як окремі слова
      const nameWords = normalizedName.split(/\s+/)
      const itemWords = itemName.split(/\s+/)

      // Всі слова з файлу повинні бути присутні в назві з БД в тому ж порядку
      let fileWordIndex = 0
      for (let i = 0; i < itemWords.length && fileWordIndex < nameWords.length; i++) {
        if (itemWords[i] === nameWords[fileWordIndex]) {
          fileWordIndex++
        }
      }

      return fileWordIndex === nameWords.length
    })

    if (partialMatch) {
      console.log(`Partial match found for "${name}":`, partialMatch.name)
      return partialMatch
    }

    console.log(`No match found for "${name}"`)
    return null
  }

  const createSlug = (text: string): string => {
    if (!text || typeof text !== "string") return ""
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  const parsePrice = (priceStr: string): string | null => {
    if (!priceStr || priceStr.toString().trim() === "") return null
    const cleanPrice = priceStr
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".")
    const price = Number.parseFloat(cleanPrice)
    return isNaN(price) || price === 0 ? null : cleanPrice
  }

  const findServiceBySlug = (slug: string): Service | undefined => {
    console.log("Looking for service with slug:", slug)
    console.log("Available services:", services)

    const found = safeFindInArray(services, (s) => {
      console.log("Comparing:", s.slug, "with", slug)
      return s.slug === slug
    })

    console.log("Found service:", found)
    return found
  }

  const extractSlugFromDescription = (description: string): string => {
    if (!description || typeof description !== "string") return ""

    const slugMatch = description.match(/\[([^\]]+)\]/)
    if (slugMatch && slugMatch[1]) {
      const extractedSlug = slugMatch[1].trim()
      console.log("Extracted slug from brackets:", extractedSlug, "from description:", description)
      return extractedSlug
    }

    // Якщо не знайдено в дужках, створюємо slug з тексту
    const createdSlug = createSlug(description)
    console.log("Created slug from text:", createdSlug, "from description:", description)
    return createdSlug
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!dataLoaded) {
      alert("Завантаження довідкових даних... Спробуйте ще раз через кілька секунд.")
      return
    }

    setFile(uploadedFile)
    setLoading(true)

    try {
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase()

      if (fileExtension === "csv") {
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && Array.isArray(results.data)) {
              processData(results.data)
            } else {
              console.error("Invalid CSV data")
              setLoading(false)
            }
          },
          error: (error) => {
            console.error("CSV parsing error:", error)
            setLoading(false)
          },
        })
      } else if (["xlsx", "xls"].includes(fileExtension || "")) {
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const parsedData = XLSX.utils.sheet_to_json(worksheet)

        if (Array.isArray(parsedData)) {
          processData(parsedData)
        } else {
          throw new Error("Invalid Excel data format")
        }
      } else {
        throw new Error("Непідтримуваний формат файлу")
      }
    } catch (error) {
      console.error("File processing error:", error)
      alert("Помилка обробки файлу: " + (error as Error).message)
      setLoading(false)
    }
  }

  const processData = (rawData: any[]) => {
    console.log("Processing data:", rawData.length, "rows")
    console.log("Available services for matching:", services.length)

    if (!Array.isArray(rawData)) {
      console.error("Invalid data format - not an array")
      setLoading(false)
      return
    }

    const processedData: ServiceData[] = rawData.map((row, index) => {
      console.log(`Processing row ${index + 1}:`, row)

      const id = `row-${index}`
      const description = row["Опис"] || row["Description"] || ""
      const category = row["Категорія"] || row["Category"] || ""
      // Обрізуємо пробіли та залишаємо пусто якщо немає значення
      const priceValue = (row["Стандартна ціна"] || row["Price"] || "").toString().trim()
      const price = priceValue === "" || priceValue === "0" ? "" : priceValue
      const warranty = row["Гарантія"] || row["Warranty"] || ""
      const warrantyPeriod = row["Гарантійний період"] || row["Warranty Period"] || ""
      const duration = row["Тривалість (хвилини)"] || row["Duration"] || ""

      const { brandName, seriesName, modelName } = parseCategory(category)

      const matchedBrand = findBestMatch(brandName, brands)
      const filteredSeries = safeArray(series).filter((s) => !matchedBrand || s.brand_id === matchedBrand.id)
      const matchedSeries = findBestMatch(seriesName, filteredSeries)

      const filteredModels = safeArray(models).filter(
        (m) =>
          (!matchedBrand || m.brand_id === matchedBrand.id) && (!matchedSeries || m.series_id === matchedSeries.id),
      )
      const matchedModel = findBestMatch(modelName, filteredModels)

      const serviceSlug = extractSlugFromDescription(description)
      const matchedService = findServiceBySlug(serviceSlug) || findBestMatch(description, services)

      const missingBrand = !matchedBrand && !!brandName
      const missingSeries = !matchedSeries && !!seriesName && !!matchedBrand
      const missingModel = !matchedModel && !!modelName && !!matchedBrand && !!matchedSeries

      // Критичні помилки
      const criticalErrors: string[] = []
      if (!description) criticalErrors.push("Відсутній опис послуги")
      if (!category) criticalErrors.push("Відсутня категорія")
      if (!matchedService) criticalErrors.push("Не знайдено базову послугу - обов'язково потрібна")
      
      // Попередження через відсутні елементи (можна створити або вибрати)
      const warnings: string[] = []
      if (missingBrand) warnings.push(`Бренд "${brandName}" не знайдено`)
      if (missingSeries) warnings.push(`Серія "${seriesName}" не знайдено`)
      if (missingModel) warnings.push(`Модель "${modelName}" не знайдено`)

      // Об'єднуємо помилки і попередження
      const errors = [...criticalErrors, ...warnings]

      // Статус залежить від типу помилок
      let status: "valid" | "warning" | "error" = "valid"
      if (criticalErrors.length > 0) {
        status = "error"
      } else if (warnings.length > 0) {
        status = "warning"
      }

      return {
        id,
        description,
        category,
        price,
        warranty,
        warrantyPeriod,
        duration,
        brandName,
        seriesName,
        modelName,
        brandId: matchedBrand?.id,
        seriesId: matchedSeries?.id,
        modelId: matchedModel?.id,
        serviceId: matchedService?.id,
        status,
        errors,
        missingBrand,
        missingSeries,
        missingModel,
        createMissing: true, // За замовчуванням - створювати
      }
    })

    console.log("Processed data:", processedData.length, "rows")
    setData(processedData)
    setLoading(false)
    setActiveTab("preview")
  }

  const getAvailableSeries = (brandId: string): Series[] => {
    return safeArray(series).filter((s) => s.brand_id === brandId)
  }

  const getAvailableModels = (seriesId: string): Model[] => {
    return safeArray(models).filter((m) => m.series_id === seriesId)
  }

  const updateRow = (rowId: string, field: string, value: string | boolean) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id !== rowId) return row

        const updatedRow = { ...row }

        // Обробка checkbox для createMissing
        if (field === "createMissing") {
          updatedRow.createMissing = value as boolean
          return updatedRow
        }

        updatedRow[field as keyof ServiceData] = value as any

        // Каскадне оновлення при зміні бренду
        if (field === "brandId") {
          const brand = safeFindInArray(brands, (b) => b.id === value)
          updatedRow.brandName = brand?.name || ""
          // Очищуємо серію та модель при зміні бренду
          updatedRow.seriesId = ""
          updatedRow.seriesName = ""
          updatedRow.modelId = ""
          updatedRow.modelName = ""
        }
        // Каскадне оновлення при зміні серії
        else if (field === "seriesId") {
          const selectedSeries = safeFindInArray(series, (s) => s.id === value)
          updatedRow.seriesName = selectedSeries?.name || ""
          // Очищуємо модель при зміні серії
          updatedRow.modelId = ""
          updatedRow.modelName = ""
        }
        // Оновлення при зміні моделі
        else if (field === "modelId") {
          const model = safeFindInArray(models, (m) => m.id === value)
          updatedRow.modelName = model?.name || ""
        }
        // Оновлення при зміні послуги
        else if (field === "serviceId") {
          const service = safeFindInArray(services, (s) => s.id === value)
          updatedRow.serviceId = service?.id
        }
        // Обробка порожніх цін - залишаємо порожнім для null в БД
        else if (field === "price") {
          updatedRow.price = (value as string)
        }

        // Перевалідація після змін
        const criticalErrors: string[] = []
        if (!updatedRow.description) criticalErrors.push("Відсутній опис послуги")
        if (!updatedRow.category) criticalErrors.push("Відсутня категорія")
        if (!updatedRow.serviceId) criticalErrors.push("Не обрано базову послугу")

        const missingBrand = !updatedRow.brandId && !!updatedRow.brandName
        const missingSeries = !updatedRow.seriesId && !!updatedRow.seriesName && !!updatedRow.brandId
        const missingModel = !updatedRow.modelId && !!updatedRow.modelName && !!updatedRow.brandId && !!updatedRow.seriesId

        // Попередження через відсутні елементи
        const warnings: string[] = []
        if (missingBrand) warnings.push(`Бренд "${updatedRow.brandName}" не знайдено`)
        if (missingSeries) warnings.push(`Серія "${updatedRow.seriesName}" не знайдено`)
        if (missingModel) warnings.push(`Модель "${updatedRow.modelName}" не знайдено`)

        // Якщо користувач вибрав не створювати і є відсутні елементи - це помилка
        const hasUnhandledMissing = (missingBrand || missingSeries || missingModel) && !updatedRow.createMissing

        // Об'єднуємо помилки
        const errors = [...criticalErrors, ...warnings]

        // Розраховуємо статус
        let status: "valid" | "warning" | "error" = "valid"
        if (criticalErrors.length > 0) {
          status = "error"
        } else if (warnings.length > 0 && updatedRow.createMissing) {
          status = "warning"
        } else if (hasUnhandledMissing) {
          status = "error"
        }

        updatedRow.status = status
        updatedRow.errors = errors
        updatedRow.missingBrand = missingBrand
        updatedRow.missingSeries = missingSeries
        updatedRow.missingModel = missingModel

        return updatedRow
      }),
    )
  }

  const handleImport = async () => {
    // Фільтруємо рядки для імпорту:
    // 1. Валідні рядки (status: "valid")
    // 2. Рядки з попередженнями, але з createMissing: true
    const rowsToImport = data.filter((row) => {
      if (row.status === "error") return false // Помилки - виключаємо
      if (row.status === "valid") return true // Валідні - включаємо
      if (row.status === "warning") {
        // Для попередження - включаємо тільки якщо користувач вибрав створення
        return row.createMissing === true
      }
      return false
    })

    if (rowsToImport.length === 0) {
      alert("Немає записів для імпорту. Будь ласка, виправте помилки або дозвольте створення відсутніх елементів.")
      return
    }

    if (!confirm(`Імпортувати ${rowsToImport.length} послуг?`)) {
      return
    }

    setImporting(true)

    try {
      const response = await fetch("/api/admin/services-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: rowsToImport }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Помилка імпорту")
      }

      const result = await response.json()
      
      let messageText = `✅ Імпорт завершено!\n\n`
      messageText += `📊 Результати:\n`
      messageText += `  ✓ Створено послуг: ${result.created}\n`
      messageText += `  ↻ Оновлено послуг: ${result.updated}`
      
      if (result.skipped > 0) {
        messageText += `\n  ⊘ Пропущено: ${result.skipped}`
      }
      
      if (result.errors > 0) {
        messageText += `\n  ✗ Помилок: ${result.errors}`
      }
      
      if (result.brandsCreated > 0 || result.seriesCreated > 0 || result.modelsCreated > 0) {
        messageText += `\n\n📦 Створено нових елементів:`
        if (result.brandsCreated > 0) messageText += `\n  🏢 Брендів: ${result.brandsCreated}`
        if (result.seriesCreated > 0) messageText += `\n  📋 Серій: ${result.seriesCreated}`
        if (result.modelsCreated > 0) messageText += `\n  🔧 Моделей: ${result.modelsCreated}`
      }
      
      alert(messageText)

      // Очищуємо дані після успішного імпорту
      setData([])
      setFile(null)
      setActiveTab("upload")
    } catch (error) {
      console.error("Import error:", error)
      alert("Помилка імпорту: " + (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const exportToExcel = () => {
    const exportData = data.map((row) => ({
      Статус: row.status === "valid" ? "Готово" : row.status === "warning" ? "Попередження" : "Помилка",
      Опис: row.description,
      Категорія: row.category,
      Ціна: row.price,
      Гарантія: row.warranty,
      "Гарантійний період": row.warrantyPeriod,
      Тривалість: row.duration,
      Бренд: safeFindInArray(brands, (b) => b.id === row.brandId)?.name || row.brandName || "Не знайдено",
      Серія: safeFindInArray(series, (s) => s.id === row.seriesId)?.name || row.seriesName || "Не знайдено",
      Модель: safeFindInArray(models, (m) => m.id === row.modelId)?.name || row.modelName || "Не знайдено",
      Послуга: safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "Не знайдено",
      Помилки: row.errors.join("; "),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Імпорт послуг")
    XLSX.writeFile(wb, `import-services-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const validCount = data.filter((row) => row.status === "valid").length
  const warningCount = data.filter((row) => row.status === "warning").length
  const errorCount = data.filter((row) => row.status === "error").length

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            Імпорт послуг
          </CardTitle>
          <CardDescription className="text-gray-600">
            Завантажте CSV або Excel файл для імпорту послуг
            {!dataLoaded && " • Завантаження довідкових даних..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              Виберіть файл
            </Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading || !dataLoaded}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {loading && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">Обробка файлу...</AlertDescription>
            </Alert>
          )}

          {data.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Готово: {validCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
                    <AlertCircle className="h-3 w-3 mr-2" />
                    Попередження: {warningCount}
                  </Badge>
                  <Badge variant="destructive" className="px-3 py-1">
                    <X className="h-3 w-3 mr-2" />
                    Помилки: {errorCount}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={exportToExcel} className="border-gray-300 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Експорт Excel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0 || importing}
                    className="bg-green-600 hover:bg-green-700 shadow-md"
                  >
                    {importing ? "Імпортування..." : `Імпортувати (${validCount})`}
                  </Button>
                </div>
              </div>

              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[1400px]">
                      {" "}
                      {/* Мінімальна ширина для всіх колонок */}
                      <ScrollArea className="h-[600px] w-full">
                        <Table className="w-full">
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                              <TableHead className="font-semibold text-gray-700 w-[120px] min-w-[120px]">
                                Бренд
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[120px] min-w-[120px]">
                                Серія
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[140px] min-w-[140px]">
                                Модель
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[180px] min-w-[180px]">
                                Послуга
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[80px] min-w-[80px]">
                                Ціна
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[110px] min-w-[110px]">
                                Гарантія
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[100px] min-w-[100px]">
                                Період
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[100px] min-w-[100px]">
                                Час
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[130px] min-w-[130px]">
                                Створити?
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[80px] min-w-[80px]">Дії</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.map((row, index) => (
                              <TableRow
                                key={row.id}
                                className={`
                                  ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                                  ${editingRow === row.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}
                                  hover:bg-gray-100 transition-colors
                                `}
                              >
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Select
                                      value={row.brandId || ""}
                                      onValueChange={(value) => updateRow(row.id, "brandId", value)}
                                    >
                                      <SelectTrigger className="w-full min-w-[110px] text-sm">
                                        <SelectValue placeholder="Оберіть бренд" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {safeArray(brands).map((brand) => (
                                          <SelectItem key={brand.id} value={brand.id}>
                                            {brand.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      className="truncate font-medium text-sm max-w-[110px] cursor-pointer hover:text-blue-600 hover:underline"
                                      title={
                                        safeFindInArray(brands, (b) => b.id === row.brandId)?.name ||
                                        row.brandName ||
                                        "❌ Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(brands, (b) => b.id === row.brandId)?.name ||
                                        row.brandName ||
                                        "❌ Не знайдено"}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Select
                                      value={row.seriesId || ""}
                                      onValueChange={(value) => updateRow(row.id, "seriesId", value)}
                                      disabled={!row.brandId}
                                    >
                                      <SelectTrigger className="w-full min-w-[110px] text-sm">
                                        <SelectValue placeholder="Оберіть серію" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableSeries(row.brandId || "").map((seriesItem) => (
                                          <SelectItem key={seriesItem.id} value={seriesItem.id}>
                                            {seriesItem.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      className="truncate text-sm max-w-[110px] cursor-pointer hover:text-blue-600 hover:underline"
                                      title={
                                        safeFindInArray(series, (s) => s.id === row.seriesId)?.name ||
                                        row.seriesName ||
                                        "❌ Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(series, (s) => s.id === row.seriesId)?.name ||
                                        row.seriesName ||
                                        "❌ Не знайдено"}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Select
                                      value={row.modelId || ""}
                                      onValueChange={(value) => updateRow(row.id, "modelId", value)}
                                      disabled={!row.seriesId}
                                    >
                                      <SelectTrigger className="w-full min-w-[120px] text-sm">
                                        <SelectValue placeholder="Оберіть модель" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableModels(row.seriesId || "").map((model) => (
                                          <SelectItem key={model.id} value={model.id}>
                                            {model.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      className="truncate text-sm max-w-[120px] cursor-pointer hover:text-blue-600 hover:underline"
                                      title={
                                        safeFindInArray(models, (m) => m.id === row.modelId)?.name ||
                                        row.modelName ||
                                        "❌ Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(models, (m) => m.id === row.modelId)?.name ||
                                        row.modelName ||
                                        "❌ Не знайдено"}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Select
                                      value={row.serviceId || ""}
                                      onValueChange={(value) => updateRow(row.id, "serviceId", value)}
                                    >
                                      <SelectTrigger className="w-full min-w-[160px] text-sm">
                                        <SelectValue placeholder="Оберіть послугу" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {safeArray(services).map((service) => (
                                          <SelectItem key={service.id} value={service.id}>
                                            {service.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <div
                                      className="truncate text-sm max-w-[160px] cursor-pointer hover:text-blue-600 hover:underline"
                                      title={
                                        safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "❌ Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "❌ Не знайдено"}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.price}
                                      onChange={(e) => updateRow(row.id, "price", e.target.value)}
                                      className="w-full text-sm"
                                      placeholder="0"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span
                                      className="font-medium text-sm cursor-pointer hover:text-blue-600 hover:underline"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.price || "-"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.warranty}
                                      onChange={(e) => updateRow(row.id, "warranty", e.target.value)}
                                      className="w-full text-sm"
                                      placeholder="Гарантія"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600 hover:underline"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.warranty}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.warrantyPeriod}
                                      onChange={(e) => updateRow(row.id, "warrantyPeriod", e.target.value)}
                                      className="w-full text-sm"
                                      placeholder="Період"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600 hover:underline"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.warrantyPeriod}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.duration}
                                      onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                                      className="w-full text-sm"
                                      placeholder="хв"
                                      type="number"
                                      min="0"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600 hover:underline"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.duration}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {(row.missingBrand || row.missingSeries || row.missingModel) && (
                                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded transition-colors hover:bg-blue-50">
                                      <input
                                        type="checkbox"
                                        checked={row.createMissing === true}
                                        onChange={(e) => updateRow(row.id, "createMissing", e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2"
                                        title={`${row.missingBrand ? "Бренд: " + row.brandName + ", " : ""}${row.missingSeries ? "Серія: " + row.seriesName + ", " : ""}${row.missingModel ? "Модель: " + row.modelName : ""}`}
                                      />
                                      <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
                                        {row.createMissing ? "✓ Буде створено" : "⊗ Буде пропущено"}
                                      </span>
                                    </label>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                                      className={`
                                        h-8 w-8 p-0 rounded-full transition-all duration-200
                                        ${
                                          editingRow === row.id
                                            ? "bg-green-100 hover:bg-green-200 text-green-700"
                                            : "hover:bg-blue-50 hover:text-blue-600"
                                        }
                                      `}
                                      title={editingRow === row.id ? "Зберегти зміни" : "Редагувати"}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
