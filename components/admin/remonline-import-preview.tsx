"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, Upload } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface PreviewData {
  model_name: string
  brand_name: string
  series_name: string
  services: Array<{
    service_name: string
    service_description: string
    price: number | null
    warranty_months: number
    duration_hours: number
    warranty_period: string
    detailed_description: string
    what_included: string
    benefits: string
  }>
}

interface ImportResult {
  success: number
  errors: number
  details: Array<{
    row: number
    status: "success" | "error"
    model: string
    service: string
    error?: string
  }>
}

interface Props {
  preview: PreviewData[]
  totalRows: number
  totalModels: number
  rawData: any[]
  onClose: () => void
}

export function RemOnlineImportPreview({ preview, totalRows, totalModels, rawData, onClose }: Props) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const { toast } = useToast()

  const handleImport = async () => {
    try {
      setIsImporting(true)

      const response = await fetch("/api/admin/bulk-import/remonline-services/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: rawData,
          locale: "uk",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Import failed")
      }

      setImportResult(result.results)
      toast({
        title: "Імпорт завершено",
        description: result.message,
      })
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Невідома помилка",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const formatWarranty = (months: number, period: string) => {
    return period === "days" ? `${months} дн.` : `${months} міс.`
  }

  const formatDuration = (hours: number) => {
    return `${hours} год.`
  }

  if (importResult) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Результати імпорту
          </CardTitle>
          <CardDescription>
            Успішно оброблено: {importResult.success}, Помилок: {importResult.errors}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-green-700">Успішно</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
                <div className="text-sm text-red-700">Помилок</div>
              </div>
            </div>

            {importResult.details.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Рядок</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Модель</TableHead>
                      <TableHead>Послуга</TableHead>
                      <TableHead>Помилка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{detail.row}</TableCell>
                        <TableCell>
                          {detail.status === "success" ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Успіх
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Помилка</Badge>
                          )}
                        </TableCell>
                        <TableCell>{detail.model}</TableCell>
                        <TableCell>{detail.service}</TableCell>
                        <TableCell className="text-red-600 text-sm">{detail.error || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={onClose}>Закрити</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Попередній перегляд імпорту</CardTitle>
        <CardDescription>
          Знайдено {totalModels} моделей з {totalRows} послугами. Перевірте дані перед імпортом.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalModels}</div>
              <div className="text-sm text-blue-700">Моделей</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalRows}</div>
              <div className="text-sm text-green-700">Послуг</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{preview.length}</div>
              <div className="text-sm text-purple-700">У попередньому перегляді</div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Модель</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Серія</TableHead>
                  <TableHead>Послуга</TableHead>
                  <TableHead>Ціна</TableHead>
                  <TableHead>Гарантія</TableHead>
                  <TableHead>Тривалість</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((model, modelIndex) =>
                  model.services.map((service, serviceIndex) => (
                    <TableRow key={`${modelIndex}-${serviceIndex}`}>
                      {serviceIndex === 0 && (
                        <>
                          <TableCell rowSpan={model.services.length} className="font-medium">
                            {model.model_name}
                          </TableCell>
                          <TableCell rowSpan={model.services.length}>{model.brand_name}</TableCell>
                          <TableCell rowSpan={model.services.length}>{model.series_name}</TableCell>
                        </>
                      )}
                      <TableCell>{service.service_name}</TableCell>
                      <TableCell>{service.price ? formatCurrency(service.price) : "Ціна за запитом"}</TableCell>
                      <TableCell>{formatWarranty(service.warranty_months, service.warranty_period)}</TableCell>
                      <TableCell>{formatDuration(service.duration_hours)}</TableCell>
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Скасувати
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  Імпорт...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Розпочати імпорт
                </>
              )}
            </Button>
          </div>

          {totalModels > preview.length && (
            <div className="text-sm text-muted-foreground text-center">
              Показано перші {preview.length} моделей з {totalModels}. Всі дані будуть імпортовані.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
