"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Download, FileText, Eye, Edit3, Save, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as XLSX from "xlsx"

type ImportRow = {
  brand: string
  series?: string
  model: string
  service: string
  price: string | number
  isValid?: boolean
  errors?: string[]
}

export function BulkServiceImportComponent() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState<ImportRow[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ImportRow } | null>(null)
  const [editValue, setEditValue] = useState("")

  const parseFile = async (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          let rows: any[] = []

          if (file.name.endsWith(".csv")) {
            // Парсинг CSV
            const text = data as string
            const lines = text.split("\n").filter((line) => line.trim())
            const headers = lines[0].split(",").map((h) => h.trim())

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(",").map((v) => v.trim())
              const row: any = {}
              headers.forEach((header, index) => {
                row[header] = values[index] || ""
              })
              rows.push(row)
            }
          } else {
            // Парсинг Excel
            const workbook = XLSX.read(data, { type: "binary" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            rows = XLSX.utils.sheet_to_json(worksheet)
          }

          // Конвертація в наш формат
          const importRows: ImportRow[] = rows.map((row) => ({
            brand: row.brand || row.Brand || "",
            series: row.series || row.Series || "",
            model: row.model || row.Model || "",
            service: row.service || row.Service || "",
            price: row.price || row.Price || "",
            isValid: true,
            errors: [],
          }))

          // Валідація даних
          importRows.forEach((row) => {
            const errors: string[] = []
            if (!row.brand) errors.push("Відсутня назва бренду")
            if (!row.model) errors.push("Відсутня назва моделі")
            if (!row.service) errors.push("Відсутня назва послуги")
            if (!row.price) errors.push("Відсутня ціна")

            row.errors = errors
            row.isValid = errors.length === 0
          })

          resolve(importRows)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("Помилка читання файлу"))

      if (file.name.endsWith(".csv")) {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      const validExtensions = [".csv", ".xls", ".xlsx"]

      const isValidType =
        validTypes.includes(selectedFile.type) ||
        validExtensions.some((ext) => selectedFile.name.toLowerCase().endsWith(ext))

      if (isValidType) {
        setFile(selectedFile)
        try {
          const data = await parseFile(selectedFile)
          setPreviewData(data)
          setShowPreview(true)
        } catch (error) {
          toast({
            title: "Помилка",
            description: "Не вдалося прочитати файл",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть CSV або Excel файл",
          variant: "destructive",
        })
      }
    }
  }

  const handleCellEdit = (rowIndex: number, field: keyof ImportRow, value: string) => {
    setEditingCell({ row: rowIndex, field })
    setEditValue(value.toString())
  }

  const saveCellEdit = () => {
    if (editingCell) {
      const newData = [...previewData]
      newData[editingCell.row] = {
        ...newData[editingCell.row],
        [editingCell.field]: editValue,
      }

      // Повторна валідація рядка
      const row = newData[editingCell.row]
      const errors: string[] = []
      if (!row.brand) errors.push("Відсутня назва бренду")
      if (!row.model) errors.push("Відсутня назва моделі")
      if (!row.service) errors.push("Відсутня назва послуги")
      if (!row.price) errors.push("Відсутня ціна")

      row.errors = errors
      row.isValid = errors.length === 0

      setPreviewData(newData)
      setEditingCell(null)
      setEditValue("")
    }
  }

  const cancelCellEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleUpload = async () => {
    if (!previewData.length) {
      toast({
        title: "Помилка",
        description: "Немає даних для завантаження",
        variant: "destructive",
      })
      return
    }

    const validRows = previewData.filter((row) => row.isValid)
    if (validRows.length === 0) {
      toast({
        title: "Помилка",
        description: "Немає валідних рядків для імпорту",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const response = await fetch("/api/admin/bulk-import/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: validRows }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Успіх",
          description: `Імпортовано ${result.success} послуг з ${validRows.length}`,
        })
        setFile(null)
        setPreviewData([])
        setShowPreview(false)
        // Reset file input
        const fileInput = document.getElementById("file-upload") as HTMLInputElement
        if (fileInput) fileInput.value = ""
      } else {
        throw new Error(result.error || "Помилка імпорту")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Помилка завантаження файлу",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `brand,series,model,service,price
Apple,iPhone,iPhone 14,Заміна екрану,2500
Samsung,Galaxy,Galaxy S23,Заміна батареї,1200
Xiaomi,Redmi,Redmi Note 12,Ремонт роз'єму,800`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "services_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Завантажте CSV або Excel файл з послугами для масового імпорту. Файл повинен містити колонки: brand, series
          (опціонально), model, service, price.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Оберіть CSV або Excel файл</Label>
          <Input id="file-upload" type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} className="mt-2" />
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Обраний файл: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Завантажити шаблон
          </Button>
        </div>
      </div>

      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Передперегляд даних ({previewData.length} рядків)
            </CardTitle>
            <CardDescription>
              Перевірте дані перед імпортом. Ви можете редагувати комірки, клікнувши на них. Валідні рядки:{" "}
              {previewData.filter((row) => row.isValid).length} / {previewData.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Статус</TableHead>
                    <TableHead>Бренд</TableHead>
                    <TableHead>Серія</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Послуга</TableHead>
                    <TableHead>Ціна</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? "bg-red-50" : ""}>
                      <TableCell>
                        {row.isValid ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600" title={row.errors?.join(", ")}>
                            ✗
                          </span>
                        )}
                      </TableCell>
                      {(["brand", "series", "model", "service", "price"] as const).map((field) => (
                        <TableCell key={field}>
                          {editingCell?.row === index && editingCell?.field === field ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8"
                                autoFocus
                              />
                              <Button size="sm" onClick={saveCellEdit}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelCellEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center gap-2"
                              onClick={() => handleCellEdit(index, field, row[field]?.toString() || "")}
                            >
                              <span>{row[field] || "-"}</span>
                              <Edit3 className="h-3 w-3 opacity-50" />
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-4 mt-4">
              <Button
                onClick={handleUpload}
                disabled={isUploading || previewData.filter((row) => row.isValid).length === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading
                  ? "Завантаження..."
                  : `Імпортувати ${previewData.filter((row) => row.isValid).length} рядків`}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false)
                  setPreviewData([])
                  setFile(null)
                  const fileInput = document.getElementById("file-upload") as HTMLInputElement
                  if (fileInput) fileInput.value = ""
                }}
              >
                Скасувати
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
