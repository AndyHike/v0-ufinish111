"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Download, AlertCircle, CheckCircle, Edit2, Save, X } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface ServiceData {
  id: string
  description: string
  category: string
  price: string
  warranty: string
  warrantyPeriod: string
  duration: string
  // Parsed data
  brandName?: string
  seriesName?: string
  modelName?: string
  // Selected IDs
  brandId?: string
  seriesId?: string
  modelId?: string
  serviceId?: string
  // Status
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

  // Reference data
  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    try {
      const [brandsRes, seriesRes, modelsRes, servicesRes] = await Promise.all([
        fetch("/api/admin/brands"),
        fetch("/api/admin/series"),
        fetch("/api/admin/models"),
        fetch("/api/admin/services"),
      ])

      const [brandsData, seriesData, modelsData, servicesData] = await Promise.all([
        brandsRes.json(),
        seriesRes.json(),
        modelsRes.json(),
        servicesRes.json(),
      ])

      setBrands(brandsData)
      setSeries(seriesData)
      setModels(modelsData)
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading reference data:", error)
    }
  }, [])

  // Parse category string "Apple &gt; iPhone &gt; iPhone XS Max"
  const parseCategory = (category: string) => {
    const parts = category.split("&gt;").map((part) => part.trim())
    return {
      brandName: parts[0] || "",
      seriesName: parts[1] || "",
      modelName: parts[2] || "",
    }
  }

  // Find best match for brand/series/model
  const findBestMatch = (name: string, items: any[]) => {
    if (!name) return null
    const normalizedName = name.toLowerCase().trim()
    return items.find(
      (item) =>
        item.name.toLowerCase() === normalizedName ||
        item.slug.toLowerCase() === normalizedName ||
        item.name.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(item.name.toLowerCase()),
    )
  }

  // Create slug from text
  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  // Parse price with comma support
  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0
    const cleanPrice = priceStr
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".")
    const price = Number.parseFloat(cleanPrice)
    return isNaN(price) ? 0 : price
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setLoading(true)

    try {
      await loadReferenceData()

      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase()
      let parsedData: any[] = []

      if (fileExtension === "csv") {
        // Parse CSV
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            parsedData = results.data as any[]
            processData(parsedData)
          },
          error: (error) => {
            console.error("CSV parsing error:", error)
            setLoading(false)
          },
        })
      } else if (["xlsx", "xls"].includes(fileExtension || "")) {
        // Parse Excel
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        parsedData = XLSX.utils.sheet_to_json(worksheet)
        processData(parsedData)
      } else {
        throw new Error("Непідтримуваний формат файлу")
      }
    } catch (error) {
      console.error("File processing error:", error)
      setLoading(false)
    }
  }

  // Process parsed data
  const processData = (rawData: any[]) => {
    const processedData: ServiceData[] = rawData.map((row, index) => {
      const id = `row-${index}`
      const description = row["Опис"] || row["Description"] || ""
      const category = row["Категорія"] || row["Category"] || ""
      const price = row["Стандартна ціна"] || row["Price"] || ""
      const warranty = row["Гарантія"] || row["Warranty"] || ""
      const warrantyPeriod = row["Гарантійний період"] || row["Warranty Period"] || ""
      const duration = row["Тривалість (хвилини)"] || row["Duration"] || ""

      // Parse category
      const { brandName, seriesName, modelName } = parseCategory(category)

      // Find matches
      const matchedBrand = findBestMatch(brandName, brands)
      const matchedSeries = findBestMatch(
        seriesName,
        series.filter((s) => !matchedBrand || s.brand_id === matchedBrand.id),
      )
      const matchedModel = findBestMatch(
        modelName,
        models.filter(
          (m) =>
            (!matchedBrand || m.brand_id === matchedBrand.id) && (!matchedSeries || m.series_id === matchedSeries.id),
        ),
      )

      // Find service by description
      const serviceSlug = createSlug(description)
      const matchedService = services.find((s) => s.slug === serviceSlug) || findBestMatch(description, services)

      // Validate data
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

    setData(processedData)
    setLoading(false)
    setActiveTab("preview")
  }

  // Handle import
  const handleImport = async () => {
    setImporting(true)

    try {
      const response = await fetch("/api/admin/services-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Імпорт завершено!\nСтворено: ${result.created}\nОновлено: ${result.updated}\nПомилок: ${result.errors}`)
        setData([])
        setFile(null)
        setActiveTab("upload")
      } else {
        throw new Error(result.error || "Помилка імпорту")
      }
    } catch (error) {
      console.error("Import error:", error)
      alert("Помилка при імпорті: " + (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  // Export to Excel
  const exportToExcel = () => {
    const exportData = data.map((row) => ({
      Опис: row.description,
      Категорія: row.category,
      "Стандартна ціна": row.price,
      Гарантія: row.warranty,
      "Гарантійний період": row.warrantyPeriod,
      "Тривалість (хвилини)": row.duration,
      Бренд: brands.find((b) => b.id === row.brandId)?.name || row.brandName,
      Серія: series.find((s) => s.id === row.seriesId)?.name || row.seriesName,
      Модель: models.find((m) => m.id === row.modelId)?.name || row.modelName,
      Послуга: services.find((s) => s.id === row.serviceId)?.name || "",
      Статус: row.status === "valid" ? "Готово" : row.status === "warning" ? "Попередження" : "Помилка",
      Помилки: row.errors.join("; "),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Services")
    XLSX.writeFile(wb, "services-import-preview.xlsx")
  }

  // Update row data
  const updateRowData = (rowId: string, field: string, value: string) => {
    setData((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value }

          // Re-validate if needed
          if (field === "brandId") {
            const brand = brands.find((b) => b.id === value)
            updated.brandName = brand?.name || ""
            // Reset series and model if brand changed
            updated.seriesId = ""
            updated.modelId = ""
          } else if (field === "seriesId") {
            const seriesItem = series.find((s) => s.id === value)
            updated.seriesName = seriesItem?.name || ""
            // Reset model if series changed
            updated.modelId = ""
          } else if (field === "modelId") {
            const model = models.find((m) => m.id === value)
            updated.modelName = model?.name || ""
          }

          return updated
        }
        return row
      }),
    )
  }

  const validCount = data.filter((row) => row.status === "valid").length
  const warningCount = data.filter((row) => row.status === "warning").length
  const errorCount = data.filter((row) => row.status === "error").length

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Завантаження</TabsTrigger>
          <TabsTrigger value="preview" disabled={data.length === 0}>
            Передперегляд ({data.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Завантаження файлу
              </CardTitle>
              <CardDescription>Підтримуються формати: CSV, Excel (.xlsx, .xls)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Виберіть файл</Label>
                <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={loading} />
              </div>

              {loading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Обробка файлу...</AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Очікувані колонки:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Опис - назва послуги</li>
                  <li>Категорія - у форматі "Бренд &gt; Серія &gt; Модель"</li>
                  <li>Стандартна ціна - ціна послуги</li>
                  <li>Гарантія - опис гарантії</li>
                  <li>Гарантійний період - термін гарантії</li>
                  <li>Тривалість (хвилини) - час виконання</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {data.length > 0 && (
            <>
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
                  <Button onClick={handleImport} disabled={importing || validCount === 0}>
                    {importing ? "Імпорт..." : `Імпортувати (${validCount})`}
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
                                  onValueChange={(value) => updateRowData(row.id, "brandId", value)}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Виберіть бренд" />
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
                                <span className={!row.brandId ? "text-red-500" : ""}>
                                  {brands.find((b) => b.id === row.brandId)?.name || row.brandName || "Не знайдено"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.seriesId || ""}
                                  onValueChange={(value) => updateRowData(row.id, "seriesId", value)}
                                  disabled={!row.brandId}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Виберіть серію" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {series
                                      .filter((s) => s.brand_id === row.brandId)
                                      .map((seriesItem) => (
                                        <SelectItem key={seriesItem.id} value={seriesItem.id}>
                                          {seriesItem.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className={!row.seriesId ? "text-red-500" : ""}>
                                  {series.find((s) => s.id === row.seriesId)?.name || row.seriesName || "Не знайдено"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.modelId || ""}
                                  onValueChange={(value) => updateRowData(row.id, "modelId", value)}
                                  disabled={!row.seriesId}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Виберіть модель" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {models
                                      .filter((m) => m.series_id === row.seriesId)
                                      .map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                          {model.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className={!row.modelId ? "text-red-500" : ""}>
                                  {models.find((m) => m.id === row.modelId)?.name || row.modelName || "Не знайдено"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Select
                                  value={row.serviceId || ""}
                                  onValueChange={(value) => updateRowData(row.id, "serviceId", value)}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Виберіть послугу" />
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
                                <span className={!row.serviceId ? "text-red-500" : ""}>
                                  {services.find((s) => s.id === row.serviceId)?.name || "Не знайдено"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{row.price}</TableCell>
                            <TableCell>
                              {editingRow === row.id ? (
                                <Button size="sm" onClick={() => setEditingRow(null)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setEditingRow(row.id)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
