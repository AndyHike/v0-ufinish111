"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText, Download } from "lucide-react"
import { RemOnlineImport } from "./remonline-import"

export function BulkServiceImport() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"models" | "services" | "remonline">("remonline")

  const downloadTemplate = (type: "models" | "services") => {
    const templates = {
      models: {
        filename: "models_template.csv",
        headers: ["brand_name", "series_name", "model_name", "model_slug", "position"],
        sample: ["Apple", "iPhone", "iPhone 13 Pro", "iphone-13-pro", "1"],
      },
      services: {
        filename: "services_template.csv",
        headers: [
          "service_name",
          "service_slug",
          "brand_name",
          "series_name",
          "model_name",
          "price",
          "warranty_months",
        ],
        sample: ["Screen Replacement", "screen-replacement", "Apple", "iPhone", "iPhone 13 Pro", "2500", "6"],
      },
    }

    const template = templates[type]
    const csvContent = [template.headers.join(","), template.sample.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = template.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (file: File, type: "models" | "services") => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/admin/bulk-import", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Успіх",
          description: `Імпортовано ${result.imported} записів з ${result.total}`,
        })
      } else {
        throw new Error(result.error || "Import failed")
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося імпортувати файл",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === "models" ? "default" : "ghost"}
          onClick={() => setActiveTab("models")}
          className="flex-1"
        >
          Моделі
        </Button>
        <Button
          variant={activeTab === "services" ? "default" : "ghost"}
          onClick={() => setActiveTab("services")}
          className="flex-1"
        >
          Послуги
        </Button>
        <Button
          variant={activeTab === "remonline" ? "default" : "ghost"}
          onClick={() => setActiveTab("remonline")}
          className="flex-1"
        >
          RemOnline
        </Button>
      </div>

      {activeTab === "remonline" && <RemOnlineImport />}

      {activeTab !== "remonline" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Завантажити шаблон
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Завантажте шаблон CSV файлу для {activeTab === "models" ? "моделей" : "послуг"}
              </p>
              <Button onClick={() => downloadTemplate(activeTab)} variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Завантажити шаблон
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Завантажити файл
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`file-${activeTab}`}>Виберіть CSV файл</Label>
                  <Input
                    id={`file-${activeTab}`}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, activeTab)
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Підтримуються тільки CSV файли. Максимальний розмір: 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default BulkServiceImport
