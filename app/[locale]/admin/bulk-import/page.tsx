"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkModelImport } from "@/components/admin/bulk-model-import"
import { BulkServiceImport } from "@/components/admin/bulk-service-import"

export default function BulkImportPage() {
  const t = useTranslations("Admin")
  const [activeTab, setActiveTab] = useState("models")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("bulkImport")}</h1>
        <p className="text-muted-foreground">{t("bulkImportDescription")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="models">{t("models")}</TabsTrigger>
          <TabsTrigger value="services">{t("services")}</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("importModels")}</CardTitle>
              <CardDescription>{t("importModelsDescription") || "Import phone models from a CSV file"}</CardDescription>
            </CardHeader>
            <CardContent>
              <BulkModelImport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("importServices")}</CardTitle>
              <CardDescription>
                {t("importServicesDescription") || "Import services and prices for phone models from a CSV file"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkServiceImport />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
