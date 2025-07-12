"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BulkServiceImportComponent } from "./bulk-service-import-component"
import { RemOnlineImport } from "./remonline-import"

export function BulkServiceImport() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Масовий імпорт послуг</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV імпорт</TabsTrigger>
            <TabsTrigger value="remonline">RemOnline імпорт</TabsTrigger>
          </TabsList>
          <TabsContent value="csv">
            <BulkServiceImportComponent />
          </TabsContent>
          <TabsContent value="remonline">
            <RemOnlineImport />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Also export as named export for compatibility
export { BulkServiceImport as default }
