"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Upload, Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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
    if (price === null) return "Ціна за запитом"
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

  // Calculate pagination
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  // Data validation
  const validationIssues = data.filter((item) => !item.brand_name || !item.model_name || !item.service_name)

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
            Результати імпорту
          </CardTitle>
          <CardDescription>
            Успішно імпортовано: {results.success} з {results.success + results.failed} записів
            {results.failed > 0 && ` (${results.failed} помилок)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Успішно: {results.success}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Помилки: {results.failed}</span>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Помилки імпорту:</h4>
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {results.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        Рядок {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
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
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Передперегляд даних для імпорту
        </CardTitle>
        <CardDescription>
          Знайдено {data.length} записів для імпорту
          {validationIssues.length > 0 && (
            <span className="text-red-600 ml-2">({validationIssues.length} записів з проблемами)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {validationIssues.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Знайдено {validationIssues.length} записів з відсутніми обов'язковими полями (brand_name, model_name,
              service_name). Ці записи будуть пропущені при імпорті.
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
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
              {currentData.map((item, index) => {
                const hasIssues = !item.brand_name || !item.model_name || !item.service_name
                return (
                  <TableRow key={index} className={hasIssues ? "bg-red-50" : ""}>
                    <TableCell className="font-mono text-sm">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.brand_name || <span className="text-red-500">Відсутнє</span>}
                    </TableCell>
                    <TableCell>{item.model_name || <span className="text-red-500">Відсутнє</span>}</TableCell>
                    <TableCell>{item.service_name || <span className="text-red-500">Відсутнє</span>}</TableCell>
                    <TableCell>{formatPrice(item.price)}</TableCell>
                    <TableCell>{formatWarranty(item.warranty_months, item.warranty_period)}</TableCell>
                    <TableCell>{formatDuration(item.duration_hours)}</TableCell>
                    <TableCell>
                      <Badge variant={hasIssues ? "destructive" : "secondary"}>
                        {hasIssues ? "Помилка" : "Готово"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Показано {startIndex + 1}-{Math.min(endIndex, data.length)} з {data.length} записів
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Наступна
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={importing}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleImport} disabled={importing || data.length === 0} className="flex-1">
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Імпорт..." : `Імпортувати ${data.length} записів`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { RemOnlineImportPreview }
