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

  const parsePrice = (priceStr: string): number => {
    if (!priceStr || priceStr.toString().trim() === "") return 0
    const cleanPrice = priceStr
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".")
    const price = Number.parseFloat(cleanPrice)
    return isNaN(price) ? 0 : price
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
      const price = (row["Стандартна ціна"] || row["Price"] || "0").toString()
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

      const errors: string[] = []
      if (!description) errors.push("Відсутній опис послуги")
      if (!category) errors.push("Відсутня категорія")
      if (!matchedService) errors.push(`Не знайдено базову послугу з slug: ${serviceSlug}`)
      if (!matchedBrand) errors.push("Не знайдено бренд")
      if (!matchedModel) errors.push("Не знайдено модель")

      const status = errors.length === 0 ? "valid" : errors.some((e) => e.includes("Не знайдено")) ? "warning" : "error"

      console.log(`Row ${index + 1} processed:`, {
        description,
        serviceSlug,
        matchedService: matchedService?.name,
        status,
        errors,
      })

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

  const updateRow = (rowId: string, field: string, value: string) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id !== rowId) return row

        const updatedRow = { ...row, [field]: value }

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
          // Зберігаємо тільки ID послуги
          updatedRow.serviceId = service?.id
        }
        // Обробка порожніх цін
        else if (field === "price") {
          updatedRow.price = value === "" ? "0" : value
        }

        // Перевалідація після змін
        const errors: string[] = []
        if (!updatedRow.description) errors.push("Відсутній опис послуги")
        if (!updatedRow.category) errors.push("Відсутня категорія")
        if (!updatedRow.serviceId) errors.push("Не обрано базову послугу")
        if (!updatedRow.brandId) errors.push("Не обрано бренд")
        if (!updatedRow.modelId) errors.push("Не обрано модель")

        updatedRow.status = errors.length === 0 ? "valid" : "warning"
        updatedRow.errors = errors

        return updatedRow
      }),
    )
  }

  const handleImport = async () => {
    const validRows = data.filter((row) => row.status === "valid")

    if (validRows.length === 0) {
      alert("Немає валідних записів для імпорту")
      return
    }

    if (!confirm(`Імпортувати ${validRows.length} послуг?`)) {
      return
    }

    setImporting(true)

    try {
      const response = await fetch("/api/admin/services-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: validRows }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Помилка імпорту")
      }

      const result = await response.json()
      alert(`Імпорт завершено успішно!\nСтворено нових послуг: ${result.created}\nОновлено існуючих: ${result.updated}`)

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
                                Статус
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[250px] min-w-[250px]">
                                Опис
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[150px] min-w-[150px]">
                                Бренд
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[150px] min-w-[150px]">
                                Серія
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[150px] min-w-[150px]">
                                Модель
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[180px] min-w-[180px]">
                                Послуга
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[100px] min-w-[100px]">
                                Ціна
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[100px] min-w-[100px]">
                                Гарантія
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[120px] min-w-[120px]">
                                Період
                              </TableHead>
                              <TableHead className="font-semibold text-gray-700 w-[100px] min-w-[100px]">
                                Тривалість
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
                                  <Badge
                                    variant={
                                      row.status === "valid"
                                        ? "default"
                                        : row.status === "warning"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                    className={`
                                      text-xs font-medium px-2 py-1
                                      ${
                                        row.status === "valid"
                                          ? "bg-green-100 text-green-800 border-green-200"
                                          : row.status === "warning"
                                            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                            : "bg-red-100 text-red-800 border-red-200"
                                      }
                                    `}
                                  >
                                    {row.status === "valid"
                                      ? "Готово"
                                      : row.status === "warning"
                                        ? "Попередження"
                                        : "Помилка"}
                                  </Badge>
                                  {row.errors.length > 0 && (
                                    <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200 max-w-[110px]">
                                      <div className="space-y-1">
                                        {row.errors.map((error, i) => (
                                          <div key={i} className="truncate" title={error}>
                                            • {error}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.description}
                                      onChange={(e) => updateRow(row.id, "description", e.target.value)}
                                      className="w-full min-w-[230px] text-sm"
                                      placeholder="Опис послуги"
                                    />
                                  ) : (
                                    <div className="max-w-[230px]">
                                      <div className="font-medium text-sm leading-tight" title={row.description}>
                                        {row.description}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Select
                                      value={row.brandId || ""}
                                      onValueChange={(value) => updateRow(row.id, "brandId", value)}
                                    >
                                      <SelectTrigger className="w-full min-w-[130px] text-sm">
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
                                      className="truncate font-medium text-sm max-w-[130px] cursor-pointer hover:text-blue-600"
                                      title={
                                        safeFindInArray(brands, (b) => b.id === row.brandId)?.name ||
                                        row.brandName ||
                                        "Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(brands, (b) => b.id === row.brandId)?.name ||
                                        row.brandName ||
                                        "Не знайдено"}
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
                                      <SelectTrigger className="w-full min-w-[130px] text-sm">
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
                                      className="truncate text-sm max-w-[130px] cursor-pointer hover:text-blue-600"
                                      title={
                                        safeFindInArray(series, (s) => s.id === row.seriesId)?.name ||
                                        row.seriesName ||
                                        "Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(series, (s) => s.id === row.seriesId)?.name ||
                                        row.seriesName ||
                                        "Не знайдено"}
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
                                      <SelectTrigger className="w-full min-w-[130px] text-sm">
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
                                      className="truncate text-sm max-w-[130px] cursor-pointer hover:text-blue-600"
                                      title={
                                        safeFindInArray(models, (m) => m.id === row.modelId)?.name ||
                                        row.modelName ||
                                        "Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(models, (m) => m.id === row.modelId)?.name ||
                                        row.modelName ||
                                        "Не знайдено"}
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
                                      className="truncate text-sm max-w-[160px] cursor-pointer hover:text-blue-600"
                                      title={
                                        safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "Не знайдено"
                                      }
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "Не знайдено"}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.price}
                                      onChange={(e) => updateRow(row.id, "price", e.target.value)}
                                      className="w-full min-w-[80px] text-sm"
                                      placeholder="0"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span
                                      className="font-medium text-sm cursor-pointer hover:text-blue-600"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.price || "0"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {editingRow === row.id ? (
                                    <Input
                                      value={row.warranty}
                                      onChange={(e) => updateRow(row.id, "warranty", e.target.value)}
                                      className="w-full min-w-[80px] text-sm"
                                      placeholder="Гарантія"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600"
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
                                      className="w-full min-w-[100px] text-sm"
                                      placeholder="Період"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600"
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
                                      className="w-full min-w-[80px] text-sm"
                                      placeholder="хв"
                                      type="number"
                                      min="0"
                                    />
                                  ) : (
                                    <span
                                      className="text-sm cursor-pointer hover:text-blue-600"
                                      onClick={() => setEditingRow(row.id)}
                                    >
                                      {row.duration}
                                    </span>
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
