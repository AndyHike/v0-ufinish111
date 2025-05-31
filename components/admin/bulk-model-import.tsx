"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Download, X } from "lucide-react"
import Papa from "papaparse"

type ModelImportRow = {
  brand: string
  series?: string
  model: string
  image_url?: string
}

type ImportResult = {
  total: number
  success: number
  failed: number
  errors: string[]
}

interface BulkModelImportProps {
  onSuccess?: () => void
}

export function BulkModelImport({ onSuccess }: BulkModelImportProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parsedData, setParsedData] = useState<ModelImportRow[]>([])
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError(t("onlyCSVAllowed") || "Only CSV files are allowed")
      return
    }

    setFile(selectedFile)
    setError(null)

    // Parse the CSV file
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(t("csvParseError") || "Error parsing CSV file")
          console.error("CSV parse errors:", results.errors)
          return
        }

        // Validate the data structure
        const data = results.data as ModelImportRow[]
        const requiredColumns = ["brand", "model"]
        const hasRequiredColumns = requiredColumns.every((col) =>
          Object.keys(data[0] || {})
            .map((k) => k.toLowerCase())
            .includes(col.toLowerCase()),
        )

        if (!hasRequiredColumns) {
          setError(t("csvMissingColumns") || "CSV file is missing required columns")
          return
        }

        setParsedData(data)
      },
      error: (error) => {
        setError(t("csvParseError") || "Error parsing CSV file")
        console.error("CSV parse error:", error)
      },
    })
  }

  function formatImageUrl(url: string | undefined): string | null {
    if (!url || url.trim() === "") return null

    const trimmedUrl = url.trim()

    // Якщо URL починається з http або https, повертаємо його як є
    if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
      return trimmedUrl
    }

    // Якщо URL починається з /, вважаємо його локальним
    if (trimmedUrl.startsWith("/")) {
      return trimmedUrl
    }

    // Інакше додаємо / на початку
    return `/${trimmedUrl}`
  }

  async function handleUpload() {
    if (!file || parsedData.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setResult(null)

    const result: ImportResult = {
      total: parsedData.length,
      success: 0,
      failed: 0,
      errors: [],
    }

    try {
      // Process in batches to avoid overwhelming the server
      const batchSize = 10
      const batches = Math.ceil(parsedData.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize
        const end = Math.min(start + batchSize, parsedData.length)
        const batch = parsedData.slice(start, end)

        // Форматуємо URL зображень перед відправкою
        const formattedBatch = batch.map((item) => ({
          ...item,
          image_url: formatImageUrl(item.image_url),
        }))

        const response = await fetch("/api/admin/bulk-import/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: formattedBatch }),
        })

        const batchResult = await response.json()

        if (!response.ok) {
          throw new Error(batchResult.error || "Failed to process batch")
        }

        // Update results
        result.success += batchResult.success
        result.failed += batchResult.failed
        result.errors = [...result.errors, ...batchResult.errors]

        // Update progress
        setProgress(Math.round((end / parsedData.length) * 100))
      }

      setResult(result)

      if (result.failed === 0) {
        toast({
          title: t("success"),
          description: t("importSuccess") || "Import completed successfully",
        })

        if (onSuccess) onSuccess()
      } else {
        toast({
          title: t("importPartialSuccess"),
          description:
            t("importPartialSuccessDescription", {
              success: result.success,
              failed: result.failed,
              total: result.total,
            }) || `Imported ${result.success} of ${result.total} items with ${result.failed} failures`,
          variant: "warning",
        })
      }
    } catch (err) {
      console.error("Error uploading data:", err)
      setError(err instanceof Error ? err.message : "Failed to upload data")
      toast({
        title: t("error"),
        description: t("importError") || "Failed to import data",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  function downloadTemplate() {
    const template = [
      {
        brand: "Apple",
        series: "iPhone",
        model: "iPhone 13",
        image_url: "https://example.com/iphone13.jpg",
      },
      {
        brand: "Samsung",
        series: "Galaxy S",
        model: "Galaxy S21",
        image_url: "",
      },
      {
        brand: "Xiaomi",
        series: "",
        model: "Redmi Note 10",
        image_url: "/images/redmi-note-10.jpg",
      },
    ]

    const csv = Papa.unparse(template)

    // Додаємо інструкції як коментар на початку CSV
    const csvWithInstructions =
      "# Інструкції для імпорту моделей телефонів:\n" +
      "# 1. Колонки brand і model є обов'язковими\n" +
      "# 2. Колонка series є необов'язковою\n" +
      "# 3. Для image_url можна використовувати:\n" +
      "#    - Повні URL (https://...)\n" +
      "#    - Відносні шляхи (/images/...)\n" +
      "#    - Залишити порожнім для моделей без зображень\n" +
      "\n" +
      csv

    const blob = new Blob([csvWithInstructions], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "model_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t("importModels")}</h3>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <Download className="mr-2 h-4 w-4" />
          {t("downloadTemplate")}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.failed === 0 ? "default" : "warning"}>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{result.failed === 0 ? t("importSuccess") : t("importPartialSuccess")}</AlertTitle>
          <AlertDescription>
            {t("importResultSummary", {
              success: result.success,
              failed: result.failed,
              total: result.total,
            })}

            {result.errors.length > 0 && (
              <div className="mt-2">
                <details>
                  <summary className="cursor-pointer font-medium">{t("showErrors")}</summary>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {result.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...{t("andMoreErrors", { count: result.errors.length - 10 })}</li>
                    )}
                  </ul>
                </details>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

            {!file ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-semibold">{t("dropCSVFile")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("orClickToUpload")}</p>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="mt-4">
                  {t("selectFile")}
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsedData.length} {t("rowsDetected")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null)
                      setParsedData([])
                      setResult(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{t("processing")}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <Button onClick={handleUpload} disabled={isProcessing || parsedData.length === 0} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  {isProcessing ? t("processing") : t("uploadAndProcess")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">{t("previewData")}</h3>
          <div className="border rounded-lg overflow-auto max-h-64">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("brand")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("series")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("model")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("imageUrl")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{row.brand}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{row.series || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{row.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm truncate max-w-xs">{row.image_url || "-"}</td>
                  </tr>
                ))}
                {parsedData.length > 5 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500">
                      {t("andMoreRows", { count: parsedData.length - 5 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
