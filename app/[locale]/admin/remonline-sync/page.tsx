import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RemOnlineCategoriesManager } from "@/components/admin/remonline-categories-manager"
import { RemOnlineServicesSync } from "@/components/admin/remonline-services-sync"
import { RemOnlineServicesReview } from "@/components/admin/remonline-services-review"

export default function RemOnlineSyncPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Синхронізація RemOnline</h1>
        <p className="text-muted-foreground">
          Управління синхронізацією послуг з RemOnline API з автоматичним розподілом по брендам, серіям та моделям
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Категорії</TabsTrigger>
          <TabsTrigger value="sync">Синхронізація</TabsTrigger>
          <TabsTrigger value="review">Перевірка послуг</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Завантаження...</CardTitle>
                  <CardDescription>Завантаження категорій RemOnline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RemOnlineCategoriesManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="sync">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Завантаження...</CardTitle>
                  <CardDescription>Підготовка синхронізації</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RemOnlineServicesSync />
          </Suspense>
        </TabsContent>

        <TabsContent value="review">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Завантаження...</CardTitle>
                  <CardDescription>Завантаження послуг для перевірки</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <RemOnlineServicesReview />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
