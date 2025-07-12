"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, AlertCircle } from "lucide-react"

type ServiceRow = {
  service_name: string
  brand_name: string
  series_name?: string
  model_name: string
  price?: number
  warranty_months?: number
  duration_hours?: number
}

export function BulkServiceImportComponent() {
  const { toast } = useToast()
  const [csvData, setCsvData] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть CSV файл",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const processImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Помилка",
        description: "Будь ласка, завантажте CSV файл або введіть дані",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch("/api/admin/bulk-import/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData }),
      })

      const result = await response.json()

      if (response.ok) {
        setResults(result)
        toast({
          title: "Успіх",
          description: `Імпортовано ${result.success} послуг з ${result.total}`,
        })
      } else {
        throw new Error(result.error || "Failed to process import")
      }
    } catch (error) {
      console.error("Error processing import:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося обробити імпорт",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const template = `service_name,brand_name,series_name,model_name,price,warranty_months,duration_hours
Заміна екрану,Apple,iPhone,iPhone 13,2500,12,2
Заміна батареї,Samsung,Galaxy,Galaxy S21,1200,6,1
Ремонт роз'єму,Xiaomi,Redmi,Redmi Note 10,800,3,1.5`

    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "services_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Імпорт послуг</h3>
        <Button variant="outline" onClick={downloadTemplate}>
          <FileText className="h-4 w-4 mr-2" />
          Завантажити шаблон
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Завантажити CSV файл</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
        </div>

        <div>
          <Label htmlFor="csv-data">Або вставити CSV дані</Label>
          <Textarea
            id="csv-data"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="service_name,brand_name,series_name,model_name,price,warranty_months,duration_hours"
            rows={10}
            className="mt-1 font-mono text-sm"
          />
        </div>

        <Button onClick={processImport} disabled={isProcessing || !csvData.trim()}>
          <Upload className="h-4 w-4 mr-2" />
          {isProcessing ? "Обробка..." : "Імпортувати"}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold">Результати імпорту</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.success}</div>
              <div className="text-sm text-green-700">Успішно</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.failed}</div>
              <div className="text-sm text-red-700">Помилки</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-blue-700">Всього</div>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                Помилки
              </h5>
              <div className="bg-red-50 p-4 rounded-lg">
                <ul className="text-sm text-red-700 space-y-1">
                  {results.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
