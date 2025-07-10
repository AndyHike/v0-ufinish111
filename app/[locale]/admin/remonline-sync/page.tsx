import type { Metadata } from "next"
import { RemOnlineCategoriesManager } from "@/components/admin/remonline-categories-manager"
import { RemOnlineServicesSync } from "@/components/admin/remonline-services-sync"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Синхронізація RemOnline | Адмін панель",
  description: "Управління синхронізацією з RemOnline API",
}

export default function RemOnlineSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Синхронізація RemOnline</h1>
        <p className="text-muted-foreground">Налаштування та синхронізація даних з RemOnline API</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Категорії
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Синхронізація послуг
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування категорій</CardTitle>
              <CardDescription>
                Спочатку налаштуйте відповідність між категоріями RemOnline та вашими брендами/серіями
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RemOnlineCategoriesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Синхронізація послуг</CardTitle>
              <CardDescription>Синхронізуйте послуги з RemOnline API після налаштування категорій</CardDescription>
            </CardHeader>
            <CardContent>
              <RemOnlineServicesSync />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
