"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, XCircle, Upload, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface Service {
  brand_name: string
  series_name: string
  model_name: string
  service_name: string
  price: number | null
  warranty_months: number | null
  warranty_period: string
  duration_hours: number | null
  detailed_description: string | null
  what_included: string | null
  benefits: string | null
}

interface ImportResult {
  status: "success" | "error"
  service: string
  action?: string
  error?: string
}

interface Props {
  services: Service[]
  onImportComplete: () => void
}

export function RemOnlineImportPreview({ services, onImportComplete }: Props) {
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()

  const handleImport = async () => {
    setIsImporting(true)
    setShowResults(false)

    try {
      const response = await fetch("/api/admin/bulk-import/remonline-services/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ services }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Import failed")
      }

      setImportResults(result.results.details)
      setShowResults(true)

      toast({
        title: "Імпорт завершено",
        description: `Успішно: ${result.results.success}, Помилки: ${result.results.errors}`,
      })

      if (result.results.success > 0) {
        onImportComplete()
      }
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

  const formatWarranty = (months: number | null, period: string) => {
    if (!months) return "Не вказано"
    return period === "days" ? `${months} дн.` : `${months} міс.`
  }

  const formatDuration = (hours: number | null) => {
    if (!hours) return "Не вказано"
    return `${hours} год.`
  }

  if (showResults) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Результати імпорту</h3>
          <Button onClick={() => setShowResults(false)} variant="outline">
            Повернутися до перегляду
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead>Послуга</TableHead>
                <TableHead>Дія</TableHead>
                <TableHead>Помилка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {result.status === "success" ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Успіх
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Помилка
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{result.service}</TableCell>
                  <TableCell>
                    {result.action && (
                      <Badge variant="outline">{result.action === "created" ? "Створено" : "Оновлено"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-red-600 text-sm">{result.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Перегляд даних для імпорту</h3>
          <p className="text-sm text-muted-foreground">Знайдено {services.length} послуг для імпорту</p>
        </div>
        <Button onClick={handleImport} disabled={isImporting || services.length === 0}>
          <Upload className="mr-2 h-4 w-4" />
          {isImporting ? "Імпорт..." : "Імпортувати"}
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Немає даних для імпорту</h3>
          <p className="mt-1 text-sm text-gray-500">Завантажте CSV файл з даними послуг</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Бренд</TableHead>
                <TableHead>Серія</TableHead>
                <TableHead>Модель</TableHead>
                <TableHead>Послуга</TableHead>
                <TableHead>Ціна</TableHead>
                <TableHead>Гарантія</TableHead>
                <TableHead>Тривалість</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.slice(0, 50).map((service, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{service.brand_name}</TableCell>
                  <TableCell>{service.series_name || "—"}</TableCell>
                  <TableCell>{service.model_name}</TableCell>
                  <TableCell>{service.service_name}</TableCell>
                  <TableCell>{service.price ? formatCurrency(service.price) : "За запитом"}</TableCell>
                  <TableCell>{formatWarranty(service.warranty_months, service.warranty_period)}</TableCell>
                  <TableCell>{formatDuration(service.duration_hours)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {services.length > 50 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Показано перші 50 записів з {services.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
