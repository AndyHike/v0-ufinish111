"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BulkModelImport } from "./bulk-model-import"
import { BulkServiceImportComponent } from "./bulk-service-import-component"
import { RemOnlineImport } from "./remonline-import"

export function BulkServiceImport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Масовий імпорт</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="remonline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="remonline">RemOnline експорт</TabsTrigger>
            <TabsTrigger value="services">Послуги</TabsTrigger>
            <TabsTrigger value="models">Моделі</TabsTrigger>
          </TabsList>

          <TabsContent value="remonline" className="space-y-4">
            <RemOnlineImport />
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <BulkServiceImportComponent />
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <BulkModelImport />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Export both named and default
export { BulkServiceImport as default }
