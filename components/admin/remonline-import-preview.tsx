"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

interface ImportData {
  rowIndex: number
  brand_name: string
  model_name: string
  service_name: string
  price: number | null
  warranty_months: number | null
  duration_hours: number | null
  warranty_period: string
  detailed_description: string
  what_included: string
  benefits: string
  original_warranty_duration: string
  original_duration_minutes: string
}

interface ImportResults {
  success: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

interface Props {
  data: ImportData[]
  onImport: (data: ImportData[]) => Promise<ImportResults>
  onCancel: () => void
}

function RemOnlineImportPreview({ data, onImport, onCancel }: Props) {
  const t = useTranslations("Admin")
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)

  const handleImport = async () => {
    setImporting(true)
    try {
      const importResults = await onImport(data)
      setResults(importResults)
    } catch (error) {
      console.error("Import error:", error)
    } finally {
      setImporting(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return t("priceOnRequest")
    return `${price} Kč`
  }

  const formatWarranty = (months: number | null, period: string) => {
    if (!months) return "-"
    return period === "days" ? `${months} днів` : `${months} міс.`
  }

  const formatDuration = (hours: number | null) => {
    if (!hours) return "-"
    return `${hours} год.`
  }

  if (results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {results.failed === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            {t("importSuccess")}
          </CardTitle>
          <CardDescription>
            {t("importResultSummary", {
              success: results.success,
              total: results.success + results.failed,
              failed: results.failed,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                {t("synced")}: {results.success}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>
                {t("failed")}: {results.failed}
              </span>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">{t("showErrors")}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.errors.slice(0, 10).map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      Рядок {error.row}: {error.error}
                    </AlertDescription>
                  </Alert>
                ))}
                {results.errors.length > 10 && (
                  <p className="text-sm text-gray-500">{t("andMoreErrors", { count: results.errors.length - 10 })}</p>
                )}
              </div>
            </div>
          )}

          <Button onClick={onCancel} className="w-full">
            Закрити
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("previewData")}</CardTitle>
        <CardDescription>{t("rowsDetected", { count: data.length })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бренд</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead>Послуга</TableHead>
                <TableHead>Ціна</TableHead>
                <TableHead>Гарантія</TableHead>
                <TableHead>Тривалість</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.brand_name}</TableCell>
                  <TableCell>{item.model_name}</TableCell>
                  <TableCell>{item.service_name}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>{formatWarranty(item.warranty_months, item.warranty_period)}</TableCell>
                  <TableCell>{formatDuration(item.duration_hours)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Готово до імпорту</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length > 10 && (
            <p className="text-sm text-gray-500 mt-2 text-center">{t("andMoreRows", { count: data.length - 10 })}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={importing} className="flex-1">
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {importing ? t("saving") : t("uploadAndProcess")}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            {t("cancel")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Export the component under the expected named export
export { RemOnlineImportPreview }
