"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, AlertTriangle, FileText } from "lucide-react"

interface ImportData {
  name: string
  price: string
  category?: string
  description?: string
  [key: string]: any
}

interface PreviewProps {
  data: ImportData[]
  fileName: string
  onBack: () => void
  onImport: () => void
  isLoading: boolean
}

export function RemOnlineImportPreview({ data, fileName, onBack, onImport, isLoading }: PreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const validateRow = (row: ImportData) => {
    const errors: string[] = []

    if (!row.name || row.name.trim() === "") {
      errors.push("Відсутня назва")
    }

    if (!row.price || row.price.trim() === "") {
      errors.push("Відсутня ціна")
    } else {
      const price = Number.parseFloat(
        row.price
          .toString()
          .replace(/[^\d.,]/g, "")
          .replace(",", "."),
      )
      if (isNaN(price) || price <= 0) {
        errors.push("Неправильна ціна")
      }
    }

    return errors
  }

  const validRows = data.filter((row) => validateRow(row).length === 0)
  const invalidRows = data.filter((row) => validateRow(row).length > 0)

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const getRowStatus = (row: ImportData) => {
    const errors = validateRow(row)
    return errors.length === 0 ? "valid" : "invalid"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Передперегляд імпорту</CardTitle>
              <CardDescription>{fileName}</CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-sm text-gray-500">Всього записів</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
            <p className="text-sm text-gray-500">Валідних</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{invalidRows.length}</p>
            <p className="text-sm text-gray-500">З помилками</p>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Статус</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Ціна</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead>Опис</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, index) => {
                const status = getRowStatus(row)
                const errors = validateRow(row)

                return (
                  <TableRow key={startIndex + index} className={status === "invalid" ? "bg-red-50" : ""}>
                    <TableCell>
                      {status === "valid" ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Помилка
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={!row.name ? "text-red-500" : ""}>{row.name || "Відсутня назва"}</p>
                        {errors.length > 0 && (
                          <div className="mt-1">
                            {errors.map((error, i) => (
                              <p key={i} className="text-xs text-red-500">
                                {error}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={!row.price ? "text-red-500" : ""}>{row.price || "Відсутня ціна"}</TableCell>
                    <TableCell>{row.category || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{row.description || "-"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Показано {startIndex + 1}-{Math.min(endIndex, data.length)} з {data.length} записів
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Попередня
              </Button>
              <span className="flex items-center px-3 text-sm">
                {currentPage} з {totalPages}
              </span>
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

        {/* Import Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            <p className="font-medium">Готово до імпорту: {validRows.length} записів</p>
            {invalidRows.length > 0 && (
              <p className="text-sm text-red-600">{invalidRows.length} записів будуть пропущені через помилки</p>
            )}
          </div>
          <Button onClick={onImport} disabled={isLoading || validRows.length === 0} className="min-w-[120px]">
            {isLoading ? "Імпорт..." : `Імпортувати ${validRows.length}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
