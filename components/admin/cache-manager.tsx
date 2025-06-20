"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Trash2 } from "lucide-react"
import { useSiteSettings } from "@/hooks/use-site-settings"
import { toast } from "sonner"

export function CacheManager() {
  const { clearCache } = useSiteSettings()

  const handleClearCache = () => {
    clearCache()
    toast.success("Кеш очищено успішно")
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Управління кешем
        </CardTitle>
        <CardDescription>Очистіть кеш налаштувань сайту або перезавантажте сторінку</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleClearCache} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Очистити кеш
          </Button>
          <Button onClick={handleRefreshPage} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Перезавантажити
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Кеш автоматично оновлюється кожні 10 хвилин. Очистіть кеш після зміни логотипу для миттєвого оновлення.
        </p>
      </CardContent>
    </Card>
  )
}
