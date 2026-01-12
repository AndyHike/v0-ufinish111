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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, AlertCircle, CheckCircle, X, FileUp, FileDown, AlertTriangle } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"

type ImportType = "services" | "models" | "series" | "brands"

interface ImportRow {
  id: string
  status: "valid" | "warning" | "error"
  errors: string[]
  warnings: string[]
  data: Record<string, any>
  suggestedActions?: {
    field: string
    issue: string
    suggestions: Array<{ id: string; name: string }>
  }[]
}

interface ReferenceData {
  brands: Array<{ id: string; name: string; slug: string }>
  series: Array<{ id: string; name: string; slug: string; brand_id: string }>
  models: Array<{ id: string; name: string; slug: string; brand_id: string; series_id: string }>
  services: Array<{ id: string; name: string; slug: string }>
}

export function ImportExport() {
  const [importType, setImportType] = useState<ImportType>("services")
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    brands: [],
    series: [],
    models: [],
    services: [],
  })
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    loadReferenceData()
  }, [])

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

      setReferenceData({
        brands: Array.isArray(brandsData.brands) ? brandsData.brands : [],
        series: Array.isArray(seriesData.series) ? seriesData.series : [],
        models: Array.isArray(modelsData.models) ? modelsData.models : [],
        services: Array.isArray(servicesData.services) ? servicesData.services : [],
      })
      setDataLoaded(true)
    } catch (error) {
      console.error("Error loading reference data:", error)
      setDataLoaded(true)
    }
  }, [])

  const downloadTemplate = () => {
    let templateData: any[] = []
    let fileName = ""

    switch (importType) {
      case "brands":
        templateData = [
          {
            Назва: "Apple",
            "Slug (необов'язково)": "apple",
            "Позиція (необов'язково)": "1",
          },
        ]
        fileName = "template-brands.xlsx"
        break

      case "series":
        templateData = [
          {
            Назва: "iPhone",
            Бренд: "Apple",
            "Slug (необов'язково)": "iphone",
            "Позиція (необов'язково)": "1",
          },
        ]
        fileName = "template-series.xlsx"
        break

      case "models":
        templateData = [
          {
            Назва: "iPhone 11",
            Бренд: "Apple",
            Серія: "iPhone",
            "Slug (необов'язково)": "iphone-11",
            "Позиція (необов'язково)": "1",
          },
        ]
        fileName = "template-models.xlsx"
        break

      case "services":
        templateData = [
          {
            Найменування: "Оправа baterie iPhone 11",
            Опис: "[battery-replacement]",
            "Одиниця виміру": "pcs",
            Категорія: "Apple > iPhone > iPhone 11",
            Гарантія: "6 міс.",
            "Гарантійний період": "6",
            "Тривалість (хви)": "120",
            "Стандартна ціна": "1490",
          },
          {
            Найменування: "Оправа заднього скла iPhone 11",
            Опис: "[rear-glass-repair]",
            "Одиниця виміру": "pcs",
            Категорія: "Apple > iPhone > iPhone 11",
            Гарантія: "6 міс.",
            "Гарантійний період": "6",
            "Тривалість (хви)": "120",
            "Стандартна ціна": "1290",
          },
        ]
        fileName = "template-services.xlsx"
        break
    }

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Шаблон")
    XLSX.writeFile(wb, fileName)
  }

  const handleExport = async () => {
    try {
      let exportData: any[] = []
      let fileName = ""

      switch (importType) {
        case "brands":
          exportData = referenceData.brands.map((b) => ({
            Назва: b.name,
            Slug: b.slug,
          }))
          fileName = `export-brands-${new Date().toISOString().split("T")[0]}.xlsx`
          break

        case "series":
          exportData = referenceData.series.map((s) => {
            const brand = referenceData.brands.find((b) => b.id === s.brand_id)
            return {
              Назва: s.name,
              Бренд: brand?.name || "",
              Slug: s.slug,
            }
          })
          fileName = `export-series-${new Date().toISOString().split("T")[0]}.xlsx`
          break

        case "models":
          exportData = referenceData.models.map((m) => {
            const brand = referenceData.brands.find((b) => b.id === m.brand_id)
            const series = referenceData.series.find((s) => s.id === m.series_id)
            return {
              Назва: m.name,
              Бренд: brand?.name || "",
              Серія: series?.name || "",
              Slug: m.slug,
            }
          })
          fileName = `export-models-${new Date().toISOString().split("T")[0]}.xlsx`
          break

        case "services":
          const response = await fetch("/api/admin/model-services?export=true")
          const data = await response.json()

          exportData =
            data.services?.map((ms: any) => {
              const model = referenceData.models.find((m) => m.id === ms.model_id)
              const service = referenceData.services.find((s) => s.id === ms.service_id)
              const brand = referenceData.brands.find((b) => b.id === model?.brand_id)
              const series = referenceData.series.find((s) => s.id === model?.series_id)

              // Extract service name from detailed_description or use service name
              const serviceName = ms.detailed_description || service?.name || ""

              return {
                Найменування: serviceName,
                Опис: `[${service?.slug || ""}]`,
                "Одиниця виміру": "pcs",
                Категорія: `${brand?.name || ""} > ${series?.name || ""} > ${model?.name || ""}`,
                Гарантія: ms.benefits || "6 міс.",
                "Гарантійний період": ms.warranty_months || "",
                "Тривалість (хви)": Math.round((ms.duration_hours || 0) * 60),
                "Стандартна ціна": ms.price || 0,
              }
            }) || []
          fileName = `export-services-${new Date().toISOString().split("T")[0]}.xlsx`
          break
      }

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Експорт")
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Export error:", error)
      alert("Помилка експорту: " + (error as Error).message)
    }
  }

  const parseCategory = (category: string) => {
    const parts = category.split(">").map((p) => p.trim())
    return {
      brandName: parts[0] || "",
      seriesName: parts[1] || "",
      modelName: parts[2] || "",
    }
  }

  const extractSlug = (text: string): string => {
    const match = text.match(/\[([^\]]+)\]/)
    return match ? match[1].trim() : ""
  }

  const createSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim()
  }

  const findMatch = (name: string, items: any[]) => {
    const normalized = name.toLowerCase().trim()
    return items.find((item) => {
      const itemName = item.name.toLowerCase().trim()
      const itemSlug = item.slug?.toLowerCase().trim() || ""
      return itemName === normalized || itemSlug === normalized
    })
  }

  const processServicesImport = (rawData: any[]): ImportRow[] => {
    return rawData.map((row, index) => {
      const id = `row-${index}`
      const serviceName = row["Найменування"] || ""
      const description = row["Опис"] || ""
      const unit = row["Одиниця виміру"] || "pcs"
      const category = row["Категорія"] || ""
      const warranty = row["Гарантія"] || ""
      const warrantyPeriod = row["Гарантійний період"] || ""
      const duration = row["Тривалість (хви)"] || ""
      const price = row["Стандартна ціна"] || "0"

      const { brandName, seriesName, modelName } = parseCategory(category)
      const serviceSlug = extractSlug(description)

      const brand = findMatch(brandName, referenceData.brands)
      const filteredSeries = referenceData.series.filter((s) => !brand || s.brand_id === brand.id)
      const series = findMatch(seriesName, filteredSeries)
      const filteredModels = referenceData.models.filter(
        (m) => (!brand || m.brand_id === brand.id) && (!series || m.series_id === series.id),
      )
      const model = findMatch(modelName, filteredModels)
      const service = referenceData.services.find((s) => s.slug === serviceSlug)

      const errors: string[] = []
      const warnings: string[] = []
      const suggestedActions: any[] = []

      if (!serviceName) errors.push("Відсутнє найменування")
      if (!category) errors.push("Відсутня категорія")
      if (!description) errors.push("Відсутній опис")
      if (!serviceSlug) errors.push("Відсутній slug послуги в описі (формат: [slug])")

      if (!service && serviceSlug) {
        errors.push(`Послуга з slug "${serviceSlug}" не знайдена`)
      }

      if (!brand && brandName) {
        warnings.push(`Бренд "${brandName}" не знайдено`)
        suggestedActions.push({
          field: "brand",
          issue: `Бренд "${brandName}" відсутній`,
          suggestions: referenceData.brands.slice(0, 5),
        })
      }

      if (!series && seriesName && brand) {
        warnings.push(`Серію "${seriesName}" не знайдено`)
        suggestedActions.push({
          field: "series",
          issue: `Серія "${seriesName}" відсутня`,
          suggestions: filteredSeries.slice(0, 5),
        })
      }

      if (!model && modelName && brand) {
        warnings.push(`Модель "${modelName}" не знайдено`)
        suggestedActions.push({
          field: "model",
          issue: `Модель "${modelName}" відсутня`,
          suggestions: filteredModels.slice(0, 5),
        })
      }

      const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

      return {
        id,
        status,
        errors,
        warnings,
        suggestedActions,
        data: {
          serviceName,
          description,
          unit,
          category,
          warranty,
          warrantyPeriod,
          duration,
          price,
          brandName,
          seriesName,
          modelName,
          serviceSlug,
          brandId: brand?.id,
          seriesId: series?.id,
          modelId: model?.id,
          serviceId: service?.id,
        },
      }
    })
  }

  const processBrandsImport = (rawData: any[]): ImportRow[] => {
    return rawData.map((row, index) => {
      const id = `row-${index}`
      const name = row["Назва"] || ""
      const slug = row["Slug (необов'язково)"] || createSlug(name)
      const position = row["Позиція (необов'язково)"] || ""

      const errors: string[] = []
      if (!name) errors.push("Відсутня назва бренду")

      const existing = findMatch(name, referenceData.brands)
      const warnings: string[] = []
      if (existing) warnings.push(`Бренд "${name}" вже існує`)

      const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

      return {
        id,
        status,
        errors,
        warnings,
        data: { name, slug, position, existingId: existing?.id },
      }
    })
  }

  const processSeriesImport = (rawData: any[]): ImportRow[] => {
    return rawData.map((row, index) => {
      const id = `row-${index}`
      const name = row["Назва"] || ""
      const brandName = row["Бренд"] || ""
      const slug = row["Slug (необов'язково)"] || createSlug(name)
      const position = row["Позиція (необов'язково)"] || ""

      const brand = findMatch(brandName, referenceData.brands)

      const errors: string[] = []
      const warnings: string[] = []
      const suggestedActions: any[] = []

      if (!name) errors.push("Відсутня назва серії")
      if (!brandName) errors.push("Відсутня назва бренду")

      if (!brand && brandName) {
        warnings.push(`Бренд "${brandName}" не знайдено`)
        suggestedActions.push({
          field: "brand",
          issue: `Бренд "${brandName}" відсутній`,
          suggestions: referenceData.brands.slice(0, 5),
        })
      }

      const existing = brand
        ? referenceData.series.find((s) => s.brand_id === brand.id && s.name.toLowerCase() === name.toLowerCase())
        : null
      if (existing) warnings.push(`Серія "${name}" вже існує для цього бренду`)

      const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

      return {
        id,
        status,
        errors,
        warnings,
        suggestedActions,
        data: { name, slug, position, brandName, brandId: brand?.id, existingId: existing?.id },
      }
    })
  }

  const processModelsImport = (rawData: any[]): ImportRow[] => {
    return rawData.map((row, index) => {
      const id = `row-${index}`
      const name = row["Назва"] || ""
      const brandName = row["Бренд"] || ""
      const seriesName = row["Серія"] || ""
      const slug = row["Slug (необов'язково)"] || createSlug(name)
      const position = row["Позиція (необов'язково)"] || ""

      const brand = findMatch(brandName, referenceData.brands)
      const filteredSeries = referenceData.series.filter((s) => !brand || s.brand_id === brand.id)
      const series = findMatch(seriesName, filteredSeries)

      const errors: string[] = []
      const warnings: string[] = []
      const suggestedActions: any[] = []

      if (!name) errors.push("Відсутня назва моделі")
      if (!brandName) errors.push("Відсутня назва бренду")
      if (!seriesName) errors.push("Відсутня назва серії")

      if (!brand && brandName) {
        warnings.push(`Бренд "${brandName}" не знайдено`)
        suggestedActions.push({
          field: "brand",
          issue: `Бренд "${brandName}" відсутній`,
          suggestions: referenceData.brands.slice(0, 5),
        })
      }

      if (!series && seriesName && brand) {
        warnings.push(`Серію "${seriesName}" не знайдено`)
        suggestedActions.push({
          field: "series",
          issue: `Серія "${seriesName}" відсутня`,
          suggestions: filteredSeries.slice(0, 5),
        })
      }

      const existing =
        brand && series
          ? referenceData.models.find(
              (m) =>
                m.brand_id === brand.id && m.series_id === series.id && m.name.toLowerCase() === name.toLowerCase(),
            )
          : null
      if (existing) warnings.push(`Модель "${name}" вже існує для цієї серії`)

      const status = errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid"

      return {
        id,
        status,
        errors,
        warnings,
        suggestedActions,
        data: {
          name,
          slug,
          position,
          brandName,
          seriesName,
          brandId: brand?.id,
          seriesId: series?.id,
          existingId: existing?.id,
        },
      }
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!dataLoaded) {
      alert("Завантаження довідкових даних... Спробуйте ще раз.")
      return
    }

    setFile(uploadedFile)
    setLoading(true)

    try {
      const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase()
      let parsedData: any[] = []

      if (fileExtension === "csv") {
        await new Promise((resolve, reject) => {
          Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              parsedData = results.data as any[]
              resolve(results)
            },
            error: reject,
          })
        })
      } else if (["xlsx", "xls"].includes(fileExtension || "")) {
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        parsedData = XLSX.utils.sheet_to_json(worksheet)
      } else {
        throw new Error("Непідтримуваний формат файлу")
      }

      let processedRows: ImportRow[] = []

      switch (importType) {
        case "services":
          processedRows = processServicesImport(parsedData)
          break
        case "brands":
          processedRows = processBrandsImport(parsedData)
          break
        case "series":
          processedRows = processSeriesImport(parsedData)
          break
        case "models":
          processedRows = processModelsImport(parsedData)
          break
      }

      setRows(processedRows)
    } catch (error) {
      console.error("File processing error:", error)
      alert("Помилка обробки файлу: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (createMissing = false) => {
    const validRows = rows.filter((row) => (createMissing ? row.status !== "error" : row.status === "valid"))

    if (validRows.length === 0) {
      alert("Немає валідних записів для імпорту")
      return
    }

    const warningRows = validRows.filter((row) => row.status === "warning")
    if (warningRows.length > 0 && createMissing) {
      const confirmed = confirm(
        `Знайдено ${warningRows.length} записів з попередженнями.\n` +
          `Відсутні бренди, серії або моделі будуть створені автоматично.\n\n` +
          `Продовжити?`,
      )
      if (!confirmed) return
    } else if (!confirm(`Імпортувати ${validRows.length} записів?`)) {
      return
    }

    setImporting(true)

    try {
      const response = await fetch(`/api/admin/import-export/${importType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: validRows.map((r) => r.data),
          createMissing,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Помилка імпорту")
      }

      const result = await response.json()

      let message = `Імпорт завершено успішно!\n`
      message += `Створено нових: ${result.created}\n`
      message += `Оновлено існуючих: ${result.updated}\n`
      if (result.errors > 0) message += `Помилок: ${result.errors}`

      alert(message)

      await loadReferenceData()

      setRows([])
      setFile(null)
    } catch (error) {
      console.error("Import error:", error)
      alert("Помилка імпорту: " + (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows.filter((r) => r.status === "valid").length
  const warningCount = rows.filter((r) => r.status === "warning").length
  const errorCount = rows.filter((r) => r.status === "error").length

  return (
    <div className="space-y-6">
      <Tabs value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Послуги</TabsTrigger>
          <TabsTrigger value="models">Моделі</TabsTrigger>
          <TabsTrigger value="series">Серії</TabsTrigger>
          <TabsTrigger value="brands">Бренди</TabsTrigger>
        </TabsList>

        <TabsContent value={importType} className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Імпорт */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  Імпорт
                </CardTitle>
                <CardDescription>
                  Завантажте файл для імпорту{" "}
                  {importType === "services"
                    ? "послуг"
                    : importType === "models"
                      ? "моделей"
                      : importType === "series"
                        ? "серій"
                        : "брендів"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Виберіть файл (CSV або Excel)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={loading || !dataLoaded}
                  />
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Завантажити шаблон
                </Button>
              </CardContent>
            </Card>

            {/* Експорт */}
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Експорт
                </CardTitle>
                <CardDescription>
                  Експортуйте існуючі{" "}
                  {importType === "services"
                    ? "послуги"
                    : importType === "models"
                      ? "моделі"
                      : importType === "series"
                        ? "серії"
                        : "бренди"}{" "}
                  в Excel
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button onClick={handleExport} className="w-full" variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Експортувати в Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Превью імпорту */}
      {loading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Обробка файлу...</AlertDescription>
        </Alert>
      )}

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Превью імпорту</CardTitle>
            <CardDescription>Перегляньте та виправте дані перед імпортом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Готово: {validCount}
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Попередження: {warningCount}
              </Badge>
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" />
                Помилки: {errorCount}
              </Badge>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Статус</TableHead>
                    <TableHead>Дані</TableHead>
                    <TableHead>Повідомлення</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.status === "valid" && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {row.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {row.status === "error" && <X className="h-4 w-4 text-red-600" />}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {importType === "services" && (
                          <div>
                            <div>{row.data.category}</div>
                            <div className="text-muted-foreground text-xs">{row.data.description}</div>
                          </div>
                        )}
                        {importType === "brands" && row.data.name}
                        {importType === "series" && `${row.data.name} (${row.data.brandName})`}
                        {importType === "models" && `${row.data.name} (${row.data.brandName} > ${row.data.seriesName})`}
                      </TableCell>
                      <TableCell>
                        {row.errors.map((err, i) => (
                          <div key={i} className="text-red-600 text-sm">
                            {err}
                          </div>
                        ))}
                        {row.warnings.map((warn, i) => (
                          <div key={i} className="text-yellow-600 text-sm">
                            {warn}
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex gap-3">
              <Button onClick={() => handleImport(false)} disabled={importing || validCount === 0} variant="default">
                Імпортувати тільки готові ({validCount})
              </Button>
              {warningCount > 0 && (
                <Button onClick={() => handleImport(true)} disabled={importing} variant="secondary">
                  Імпортувати з автостворенням ({validCount + warningCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
