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

      setBrands(Array.isArray(brandsData) ? brandsData : [])
      setSeries(Array.isArray(seriesData) ? seriesData : [])
      setModels(Array.isArray(modelsData) ? modelsData : [])
      setServices(Array.isArray(servicesData) ? servicesData : [])
      setDataLoaded(true)

      console.log("Reference data loaded successfully")
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
    return safeItems.find((item) => {
      if (!item || !item.name) return false
      const itemName = item.name.toLowerCase()
      const itemSlug = item.slug ? item.slug.toLowerCase() : ""

      return (
        itemName === normalizedName ||
        itemSlug === normalizedName ||
        itemName.includes(normalizedName) ||
        normalizedName.includes(itemName)
      )
    })
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
    if (!priceStr) return 0
    const cleanPrice = priceStr
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".")
    const price = Number.parseFloat(cleanPrice)
    return isNaN(price) ? 0 : price
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

    if (!Array.isArray(rawData)) {
      console.error("Invalid data format - not an array")
      setLoading(false)
      return
    }

    const processedData: ServiceData[] = rawData.map((row, index) => {
      const id = `row-${index}`
      const description = row["Опис"] || row["Description"] || ""
      const category = row["Категорія"] || row["Category"] || ""
      const price = row["Стандартна ціна"] || row["Price"] || ""
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

      const serviceSlug = createSlug(description)
      const matchedService =
        safeFindInArray(services, (s) => s.slug === serviceSlug) || findBestMatch(description, services)

      const errors: string[] = []
      if (!description) errors.push("Відсутній опис послуги")
      if (!category) errors.push("Відсутня категорія")
      if (!price || parsePrice(price) <= 0) errors.push("Некоректна ціна")
      if (!matchedService) errors.push("Не знайдено базову послугу")
      if (!matchedBrand) errors.push("Не знайдено бренд")
      if (!matchedModel) errors.push("Не знайдено модель")

      const status = errors.length === 0 ? "valid" : errors.some((e) => e.includes("Не знайдено")) ? "warning" : "error"

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

  const updateRow = (rowId: string, field: string, value: string) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id !== rowId) return row

        const updatedRow = { ...row, [field]: value }

        // Оновлюємо залежні поля при зміні бренду/серії
        if (field === "brandId") {
          const brand = safeFindInArray(brands, (b) => b.id === value)
          updatedRow.brandName = brand?.name || ""
          updatedRow.seriesId = ""
          updatedRow.seriesName = ""
          updatedRow.modelId = ""
          updatedRow.modelName = ""
        } else if (field === "seriesId") {
          const selectedSeries = safeFindInArray(series, (s) => s.id === value)
          updatedRow.seriesName = selectedSeries?.name || ""
          updatedRow.modelId = ""
          updatedRow.modelName = ""
        } else if (field === "modelId") {
          const model = safeFindInArray(models, (m) => m.id === value)
          updatedRow.modelName = model?.name || ""
        } else if (field === "serviceId") {
          const service = safeFindInArray(services, (s) => s.id === value)
          updatedRow.serviceId = service?.id
        }

        const errors: string[] = []
        if (!updatedRow.description) errors.push("Відсутній опис послуги")
        if (!updatedRow.category) errors.push("Відсутня категорія")
        if (!updatedRow.price || parsePrice(updatedRow.price) <= 0) errors.push("Некоректна ціна")
        if (!updatedRow.serviceId) errors.push("Не знайдено базову послугу")
        if (!updatedRow.brandId) errors.push("Не знайдено бренд")
        if (!updatedRow.modelId) errors.push("Не знайдено модель")

        updatedRow.status =
          errors.length === 0 ? "valid" : errors.some((e) => e.includes("Не знайдено")) ? "warning" : "error"
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
        throw new Error("Помилка імпорту")
      }

      const result = await response.json()
      alert(`Імпорт завершено! Створено: ${result.created}, Оновлено: ${result.updated}`)

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Імпорт послуг
          </CardTitle>
          <CardDescription>
            Завантажте CSV або Excel файл для імпорту послуг
            {!dataLoaded && " • Завантаження довідкових даних..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file">Виберіть файл</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading || !dataLoaded}
            />
          </div>

          {loading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Обробка файлу...</AlertDescription>
            </Alert>
          )}

          {data.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Готово: {validCount}
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Попередження: {warningCount}
                  </Badge>
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Помилки: {errorCount}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportToExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Експорт Excel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0 || importing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {importing ? "Імпортування..." : `Імпортувати (${validCount})`}
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Статус</TableHead>
                          <TableHead>Опис</TableHead>
                          <TableHead>Бренд</TableHead>
                          <TableHead>Серія</TableHead>
                          <TableHead>Модель</TableHead>
                          <TableHead>Послуга</TableHead>
                          <TableHead>Ціна</TableHead>
                          <TableHead>Гарантія</TableHead>
                          <TableHead>Період</TableHead>
                          <TableHead>Тривалість</TableHead>
                          <TableHead>Дії</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Badge
                                variant={
                                  row.status === "valid"
                                    ? "default"
                                    : row.status === "warning"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className={
                                  row.status === "valid"
                                    ? "bg-green-100 text-green-800"
                                    : row.status === "warning"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : ""
                                }
                              >
                                {row.status === "valid"
                                  ? "Готово"
                                  : row.status === "warning"
                                    ? "Попередження"
                                    : "Помилка"}
                              </Badge>
                              {row.errors.length > 0 && (
                                <div className="text-xs text-red-600 mt-1">{row.errors.join(", ")}</div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={row.description}>
                                {row.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.brandId || ""}
                                  onValueChange={(value) => updateRow(row.id, "brandId", value)}
                                >
                                  <SelectTrigger className="w-[150px]">
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
                                <div className="truncate">
                                  {safeFindInArray(brands, (b) => b.id === row.brandId)?.name ||
                                    row.brandName ||
                                    "Не знайдено"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.seriesId || ""}
                                  onValueChange={(value) => updateRow(row.id, "seriesId", value)}
                                  disabled={!row.brandId}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Оберіть серію" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {safeArray(series)
                                      .filter((s) => s.brand_id === row.brandId)
                                      .map((series) => (
                                        <SelectItem key={series.id} value={series.id}>
                                          {series.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="truncate">
                                  {safeFindInArray(series, (s) => s.id === row.seriesId)?.name ||
                                    row.seriesName ||
                                    "Не знайдено"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.modelId || ""}
                                  onValueChange={(value) => updateRow(row.id, "modelId", value)}
                                  disabled={!row.seriesId}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Оберіть модель" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {safeArray(models)
                                      .filter((m) => m.series_id === row.seriesId)
                                      .map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                          {model.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="truncate">
                                  {safeFindInArray(models, (m) => m.id === row.modelId)?.name ||
                                    row.modelName ||
                                    "Не знайдено"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.serviceId || ""}
                                  onValueChange={(value) => updateRow(row.id, "serviceId", value)}
                                >
                                  <SelectTrigger className="w-[150px]">
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
                                <div className="truncate">
                                  {safeFindInArray(services, (s) => s.id === row.serviceId)?.name || "Не знайдено"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Input
                                  value={row.price}
                                  onChange={(e) => updateRow(row.id, "price", e.target.value)}
                                  className="w-[100px]"
                                />
                              ) : (
                                row.price
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Input
                                  value={row.warranty}
                                  onChange={(e) => updateRow(row.id, "warranty", e.target.value)}
                                  className="w-[100px]"
                                />
                              ) : (
                                row.warranty
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Input
                                  value={row.warrantyPeriod}
                                  onChange={(e) => updateRow(row.id, "warrantyPeriod", e.target.value)}
                                  className="w-[100px]"
                                />
                              ) : (
                                row.warrantyPeriod
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Input
                                  value={row.duration}
                                  onChange={(e) => updateRow(row.id, "duration", e.target.value)}
                                  className="w-[100px]"
                                />
                              ) : (
                                row.duration
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
