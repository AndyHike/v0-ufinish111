"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkModelImport } from "./bulk-model-import"
import { BulkServiceImport as BulkServiceImportComponent } from "./bulk-service-import"
import { RemOnlineImport } from "./remonline-import"
import { FileSpreadsheet, Upload, Download } from "lucide-react"

export function BulkServiceImport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Масовий імпорт</h1>
        <p className="text-muted-foreground">Імпорт моделей та послуг з CSV файлів або RemOnline</p>
      </div>

      <Tabs defaultValue="remonline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="remonline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            RemOnline
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Моделі
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Послуги
          </TabsTrigger>
        </TabsList>

        <TabsContent value="remonline">
          <Card>
            <CardHeader>
              <CardTitle>Імпорт з RemOnline</CardTitle>
            </CardHeader>
            <CardContent>
              <RemOnlineImport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Імпорт моделей</CardTitle>
            </CardHeader>
            <CardContent>
              <BulkModelImport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Імпорт послуг</CardTitle>
            </CardHeader>
            <CardContent>
              <BulkServiceImportComponent />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default BulkServiceImport
