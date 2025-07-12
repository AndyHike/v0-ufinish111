"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Download, FileText } from "lucide-react"

export function BulkServiceImportComponent() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Помилка",
          description: "Будь ласка, оберіть CSV файл",
          variant: "destructive",
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть файл для завантаження",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/bulk-import/services", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Успіх",
          description: `Імпортовано ${result.imported} послуг з ${result.total}`,
        })
        setFile(null)
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
    const csvContent = `model_id,service_id,price,warranty_duration,warranty_period,duration_minutes
1,1,1500,12,months,120
2,1,1800,6,months,90`

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
          Завантажте CSV файл з послугами для масового імпорту. Файл повинен містити колонки: model_id, service_id,
          price, warranty_duration, warranty_period, duration_minutes.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Оберіть CSV файл</Label>
          <Input id="file-upload" type="file" accept=".csv" onChange={handleFileChange} className="mt-2" />
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Обраний файл: {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Завантаження..." : "Завантажити"}
          </Button>

          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Завантажити шаблон
          </Button>
        </div>
      </div>
    </div>
  )
}
