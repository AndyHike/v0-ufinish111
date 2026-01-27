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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
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
  
  // Modal states
  const [modal, setModal] = useState<{
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    isConfirm?: boolean
  }>({
    open: false,
    title: "",
    message: "",
  })
  
  // Export filters
  const [exportBrandId, setExportBrandId] = useState<string>("")
  const [exportSeriesId, setExportSeriesId] = useState<string>("")
  const [exportModelId, setExportModelId] = useState<string>("")

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
        brands: Array.isArray(brandsData) ? brandsData : Array.isArray(brandsData.brands) ? brandsData.brands : [],
        series: Array.isArray(seriesData) ? seriesData : Array.isArray(seriesData.series) ? seriesData.series : [],
        models: Array.isArray(modelsData) ? modelsData : Array.isArray(modelsData.models) ? modelsData.models : [],
        services: Array.isArray(servicesData) ? servicesData : Array.isArray(servicesData.services) ? servicesData.services : [],
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
          // Build URL with filters
          const params = new URLSearchParams()
          if (exportModelId) params.append("modelId", exportModelId)
          else if (exportSeriesId) params.append("seriesId", exportSeriesId)
          else if (exportBrandId) params.append("brandId", exportBrandId)
          
          const exportUrl = `/api/admin/export/services?${params.toString()}`
          
          // Fetch CSV from export endpoint
          const response = await fetch(exportUrl)
          if (!response.ok) {
            throw new Error("Помилка експорту")
          }
          
          const csvText = await response.text()
          const parsedData = Papa.parse(csvText, { header: true })
          
          exportData = parsedData.data.filter((row: any) => {
            // Filter out empty rows
            return Object.values(row).some(val => val !== "")
          })

          // Translate headers to Ukrainian for Excel export
          exportData = exportData.map((row: any) => ({
            Бренд: row.brand || "",
            Серія: row.series || "",
            Модель: row.model || "",
            "Послуга (UK)": row.service_uk || "",
            "Опис (UK)": row.description_uk || "",
            "Послуга (EN)": row.service_en || "",
            "Опис (EN)": row.description_en || "",
            "Послуга (CS)": row.service_cs || "",
            "Опис (CS)": row.description_cs || "",
            Ціна: row.price || "",
            "Гарантія (місяці)": row.warranty_months || "",
            "Тривалість (годин)": row.duration_hours || "",
            "Детальний опис": row.detailed_description || "",
          }))
          
          // Set filename based on filter
          let filterName = ""
          if (exportModelId) {
            const model = referenceData.models.find((m) => m.id === exportModelId)
            filterName = model?.name || "model"
          } else if (exportSeriesId) {
            const series = referenceData.series.find((s) => s.id === exportSeriesId)
            filterName = series?.name || "series"
          } else if (exportBrandId) {
            const brand = referenceData.brands.find((b) => b.id === exportBrandId)
            filterName = brand?.name || "brand"
          }
          
          fileName = filterName 
            ? `export-services-${filterName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`
            : `export-services-${new Date().toISOString().split("T")[0]}.xlsx`
          break
      }

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Експорт")
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Export error:", error)
      setModal({
        open: true,
        title: "Помилка експорту",
        message: (error as Error).message,
        confirmText: "OK",
        isConfirm: false,
      })
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
      setModal({
        open: true,
        title: "Помилка",
        message: "Завантаження довідкових даних... Спробуйте ще раз.",
        confirmText: "OK",
        isConfirm: false,
      })
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
      setModal({
        open: true,
        title: "Помилка обробки файлу",
        message: (error as Error).message,
        confirmText: "OK",
        isConfirm: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (createMissing = false) => {
    // Включаємо всі рядки без критичних помилок (valid + warning якщо createMissing=true)
    const validRows = rows.filter((row) => {
      if (row.status === "error") return false // Виключаємо критичні помилки
      if (row.status === "valid") return true // Включаємо валідні
      if (row.status === "warning" && createMissing) return true // Включаємо попередження якщо дозволено створення
      return false
    })

    if (validRows.length === 0) {
      setModal({
        open: true,
        title: "Нема записів для імпорту",
        message: "Не знайдено валідних записів. Будь ласка, виправте помилки перед імпортом.",
        confirmText: "OK",
        isConfirm: false,
      })
      return
    }

    const warningRows = validRows.filter((row) => row.status === "warning")
    
    // Показуємо підтвердження перед імпортом
    const confirmMessage = 
      warningRows.length > 0
        ? `Буде імпортовано ${validRows.length} записів.\n\n${warningRows.length} з них мають попередження:\nВідсутні бренди, серії або моделі будуть створені автоматично.\n\nПродовжити?`
        : `Буде імпортовано ${validRows.length} записів?\n\nПродовжити?`

    setModal({
      open: true,
      title: "Підтвердження імпорту",
      message: confirmMessage,
      confirmText: "Імпортувати",
      cancelText: "Скасувати",
      isConfirm: true,
      onConfirm: async () => {
        setModal({ open: false, title: "", message: "" })
        await performImport(validRows, createMissing)
      },
    })
  }

  const performImport = async (validRows: ImportRow[], createMissing: boolean) => {
    setImporting(true)

    try {
      const dataToSend = validRows.map((r) => r.data)
      
      console.log("[v0] Sending import request:", {
        rowCount: dataToSend.length,
        createMissing,
        rows: dataToSend.map((d, i) => ({
          index: i,
          brandId: d.brandId,
          seriesId: d.seriesId,
          modelId: d.modelId,
          serviceId: d.serviceId,
          price: d.price,
        })),
      })

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

      let message = `Імпорт завершено успішно!\n\n`
      message += `✓ Створено нових: ${result.created}\n`
      message += `↻ Оновлено існуючих: ${result.updated}`
      if (result.errors > 0) message += `\n✗ Помилок: ${result.errors}`

      setModal({
        open: true,
        title: "Імпорт завершено",
        message,
        confirmText: "OK",
        isConfirm: false,
      })

      await loadReferenceData()

      setRows([])
      setFile(null)
    } catch (error) {
      console.error("Import error:", error)
      setModal({
        open: true,
        title: "Помилка імпорту",
        message: (error as Error).message,
        confirmText: "OK",
        isConfirm: false,
      })
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
              <CardContent className="pt-6 space-y-4">
                {importType === "services" && (
                  <div className="space-y-3">
                    {!dataLoaded ? (
                      <p className="text-sm text-muted-foreground">Завантаження даних...</p>
                    ) : referenceData.brands.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Бренди не знайдені. Спочатку імпортуйте бренди.</p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="export-brand">Фільтр за брендом (необов'язково)</Label>
                          <Select
                            value={exportBrandId}
                            onValueChange={(value) => {
                              setExportBrandId(value)
                              setExportSeriesId("")
                              setExportModelId("")
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Всі бренди" />
                            </SelectTrigger>
                            <SelectContent>
                              {referenceData.brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {exportBrandId && (
                          <div className="space-y-2">
                            <Label htmlFor="export-series">Фільтр за серією (необов'язково)</Label>
                            <Select
                              value={exportSeriesId}
                              onValueChange={(value) => {
                                setExportSeriesId(value)
                                setExportModelId("")
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Всі серії" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.series
                                  .filter((s) => s.brand_id === exportBrandId)
                                  .map((series) => (
                                    <SelectItem key={series.id} value={series.id}>
                                      {series.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {exportSeriesId && (
                          <div className="space-y-2">
                            <Label htmlFor="export-model">Фільтр за моделлю (необов'язково)</Label>
                            <Select value={exportModelId} onValueChange={setExportModelId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Всі моделі" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.models
                                  .filter((m) => m.series_id === exportSeriesId)
                                  .map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      {model.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {(exportBrandId || exportSeriesId || exportModelId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExportBrandId("")
                              setExportSeriesId("")
                              setExportModelId("")
                            }}
                            className="w-full"
                          >
                            Скинути фільтри
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                <Button onClick={handleExport} className="w-full" variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Експортувати в Excel
                  {importType === "services" && exportModelId && " (модель)"}
                  {importType === "services" && exportSeriesId && !exportModelId && " (серія)"}
                  {importType === "services" && exportBrandId && !exportSeriesId && " (бренд)"}
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
                    <TableHead className="w-12">Статус</TableHead>
                    <TableHead>Бренд</TableHead>
                    <TableHead>Серія</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Послуга</TableHead>
                    <TableHead className="w-20">Ціна</TableHead>
                    <TableHead className="w-24">Гарантія</TableHead>
                    <TableHead className="w-20">Період</TableHead>
                    <TableHead className="w-20">Час (хв)</TableHead>
                    <TableHead className="w-32">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    if (importType !== "services") {
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            {row.status === "valid" && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {row.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            {row.status === "error" && <X className="h-4 w-4 text-red-600" />}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
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
                      )
                    }

                    // Services view with editable fields
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.status === "valid" && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {row.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                          {row.status === "error" && <X className="h-4 w-4 text-red-600" />}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Select value={row.data.brandId || ""} onValueChange={(val) => {
                              const updated = rows.map(r => {
                                if (r.id !== row.id) return r
                                const brand = referenceData.brands.find(b => b.id === val)
                                return {
                                  ...r,
                                  data: { ...r.data, brandId: val, brandName: brand?.name || "", seriesId: "", modelId: "" }
                                }
                              })
                              setRows(updated)
                            }}>
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Бренд" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.brands.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{row.data.brandName || "❌"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Select value={row.data.seriesId || ""} onValueChange={(val) => {
                              const updated = rows.map(r => {
                                if (r.id !== row.id) return r
                                const series = referenceData.series.find(s => s.id === val)
                                return {
                                  ...r,
                                  data: { ...r.data, seriesId: val, seriesName: series?.name || "", modelId: "" }
                                }
                              })
                              setRows(updated)
                            }} disabled={!row.data.brandId}>
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Серія" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.series.filter(s => !row.data.brandId || s.brand_id === row.data.brandId).map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{row.data.seriesName || "❌"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Select value={row.data.modelId || ""} onValueChange={(val) => {
                              const updated = rows.map(r => {
                                if (r.id !== row.id) return r
                                const model = referenceData.models.find(m => m.id === val)
                                return {
                                  ...r,
                                  data: { ...r.data, modelId: val, modelName: model?.name || "" }
                                }
                              })
                              setRows(updated)
                            }} disabled={!row.data.seriesId}>
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Модель" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.models.filter(m => !row.data.seriesId || m.series_id === row.data.seriesId).map(m => (
                                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{row.data.modelName || "❌"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Select value={row.data.serviceId || ""} onValueChange={(val) => {
                              const updated = rows.map(r => {
                                if (r.id !== row.id) return r
                                const svc = referenceData.services.find(s => s.id === val)
                                return {
                                  ...r,
                                  data: { ...r.data, serviceId: val, serviceSlug: svc?.slug || "" }
                                }
                              })
                              setRows(updated)
                            }}>
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Послуга" />
                              </SelectTrigger>
                              <SelectContent>
                                {referenceData.services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm" title={row.data.serviceSlug}>{row.data.serviceSlug || "❌"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input type="number" value={row.data.price} onChange={(e) => {
                              const updated = rows.map(r => ({
                                ...r,
                                data: r.id === row.id ? { ...r.data, price: e.target.value } : r.data
                              }))
                              setRows(updated)
                            }} className="w-full text-xs" min="0" step="0.01" />
                          ) : (
                            <span className="text-sm font-medium">{row.data.price}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input value={row.data.warranty} onChange={(e) => {
                              const updated = rows.map(r => ({
                                ...r,
                                data: r.id === row.id ? { ...r.data, warranty: e.target.value } : r.data
                              }))
                              setRows(updated)
                            }} className="w-full text-xs" />
                          ) : (
                            <span className="text-sm">{row.data.warranty}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input value={row.data.warrantyPeriod} onChange={(e) => {
                              const updated = rows.map(r => ({
                                ...r,
                                data: r.id === row.id ? { ...r.data, warrantyPeriod: e.target.value } : r.data
                              }))
                              setRows(updated)
                            }} className="w-full text-xs" />
                          ) : (
                            <span className="text-sm">{row.data.warrantyPeriod}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRowId === row.id ? (
                            <Input type="number" value={row.data.duration} onChange={(e) => {
                              const updated = rows.map(r => ({
                                ...r,
                                data: r.id === row.id ? { ...r.data, duration: e.target.value } : r.data
                              }))
                              setRows(updated)
                            }} className="w-full text-xs" min="0" />
                          ) : (
                            <span className="text-sm">{row.data.duration}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant={editingRowId === row.id ? "default" : "outline"} onClick={() => setEditingRowId(editingRowId === row.id ? null : row.id)} className="text-xs">
                            {editingRowId === row.id ? "✓" : "✎"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

      {/* Custom Modal Dialog */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{modal.title}</h2>
              <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{modal.message}</p>
            </div>
            <div className="flex gap-3 justify-end">
              {modal.isConfirm && (
                <Button
                  onClick={() => setModal({ open: false, title: "", message: "" })}
                  variant="outline"
                >
                  {modal.cancelText || "Скасувати"}
                </Button>
              )}
              <Button
                onClick={() => {
                  modal.onConfirm?.()
                  if (!modal.isConfirm) {
                    setModal({ open: false, title: "", message: "" })
                  }
                }}
                variant="default"
              >
                {modal.confirmText || "OK"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
