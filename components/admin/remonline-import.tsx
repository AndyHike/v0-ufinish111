"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, FileSpreadsheet, Eye, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { RemOnlineImportPreview } from "./remonline-import-preview"
import * as XLSX from "xlsx"

interface ImportData {
  name: string
  price: string
  category?: string
  description?: string
  [key: string]: any
}

interface FileInfo {
  name: string
  size: number
  type: string
  data: ImportData[]
}

export function RemOnlineImport() {
  const t = useTranslations("Admin")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setIsLoading(true)

    try {
      const fileData = await parseFile(selectedFile)
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        data: fileData,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка читання файлу")
    } finally {
      setIsLoading(false)
    }
  }

  const parseFile = async (file: File): Promise<ImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const parsedData: ImportData[] = []

          if (file.name.endsWith(".csv")) {
            // Parse CSV
            const text = data as string
            const lines = text.split("\n")
            const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
                const row: ImportData = { name: "", price: "" }
                headers.forEach((header, index) => {
                  row[header] = values[index] || ""
                })
                if (row.name && row.price) {
                  parsedData.push(row)
                }
              }
            }
          } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            // Parse Excel
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            if (jsonData.length > 0) {
              const headers = jsonData[0].map((h: any) => String(h).trim())

              for (let i = 1; i < jsonData.length; i++) {
                if (jsonData[i] && jsonData[i].some((cell: any) => cell !== undefined && cell !== "")) {
                  const row: ImportData = { name: "", price: "" }
                  headers.forEach((header, index) => {
                    row[header] = String(jsonData[i][index] || "").trim()
                  })
                  if (row.name && row.price) {
                    parsedData.push(row)
                  }
                }
              }
            }
          }

          resolve(parsedData)
        } catch (error) {
          reject(new Error("Помилка парсингу файлу"))
        }
      }

      reader.onerror = () => reject(new Error("Помилка читання файлу"))

      if (file.name.endsWith(".csv")) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      const blob = new Blob([JSON.stringify(file.data)], { type: "application/json" })
      formData.append("file", blob, "import-data.json")
      formData.append("fileName", file.name)
      formData.append("fileType", file.type)

      const response = await fetch("/api/admin/bulk-import/remonline-services", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setResult(result)
      setProgress(100)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка імпорту")
    } finally {
      setIsLoading(false)
    }
  }

  const resetImport = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".csv")) {
      return <FileText className="h-8 w-8 text-green-600" />
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return <FileSpreadsheet className="h-8 w-8 text-blue-600" />
    }
    return <FileText className="h-8 w-8 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (showPreview && file) {
    return (
      <RemOnlineImportPreview
        data={file.data}
        fileName={file.name}
        onBack={() => setShowPreview(false)}
        onImport={handleImport}
        isLoading={isLoading}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Імпорт послуг з RemOnline
        </CardTitle>
        <CardDescription>Завантажте CSV або Excel файл з послугами для масового імпорту</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Імпорт завершено успішно! Імпортовано {result.imported} послуг.
              {result.errors?.length > 0 && ` Помилок: ${result.errors.length}`}
            </AlertDescription>
          </Alert>
        )}

        {!file && !result && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Оберіть файл для імпорту</p>
              <p className="text-sm text-gray-500">Підтримуються формати: CSV, XLSX, XLS</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="mt-4">
              {isLoading ? "Обробка..." : "Обрати файл"}
            </Button>
          </div>
        )}

        {file && !result && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              {getFileIcon(file.name)}
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • {file.data.length} записів
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Переглянути
                </Button>
                <Button variant="outline" size="sm" onClick={resetImport}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Готово до імпорту</p>
                <p className="text-xs text-gray-500">{file.data.length} записів буде імпортовано</p>
              </div>
              <Button onClick={handleImport} disabled={isLoading} className="min-w-[120px]">
                {isLoading ? "Імпорт..." : "Імпортувати"}
              </Button>
            </div>

            {isLoading && progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогрес імпорту</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-gray-500">Імпортовано</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.errors?.length || 0}</p>
                <p className="text-sm text-gray-500">Помилок</p>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium">Помилки імпорту:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error: string, index: number) => (
                    <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={resetImport} variant="outline" className="w-full bg-transparent">
              Імпортувати ще один файл
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
