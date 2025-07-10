"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, Download, CheckCircle, XCircle, AlertCircle, Zap } from "lucide-react"
import { toast } from "sonner"

interface RemOnlineCategory {
  id: string
  category_id: number
  category_title: string
  association_type: "brand" | "series"
}

interface SyncResult {
  processed: number
  created: number
  updated: number
  skipped: number
  errors: number
  details: Array<{
    remonline_id: number
    title: string
    status: "created" | "updated" | "skipped" | "error"
    error?: string
  }>
}

export function RemOnlineServicesSync() {
  const [categories, setCategories] = useState<RemOnlineCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [syncAll, setSyncAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/remonline-categories")
      const data = await response.json()

      if (response.ok) {
        setCategories(data.categories || [])
      } else {
        toast.error("Помилка завантаження категорій")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Помилка завантаження категорій")
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryToggle = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId])
    } else {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    }
  }

  const handleSyncAllToggle = (checked: boolean) => {
    setSyncAll(checked)
    if (checked) {
      setSelectedCategories([])
    }
  }

  const startSync = async () => {
    if (!syncAll && selectedCategories.length === 0) {
      toast.error("Оберіть категорії для синхронізації або увімкніть 'Синхронізувати всі'")
      return
    }

    try {
      setSyncing(true)
      setSyncResult(null)

      const response = await fetch("/api/admin/sync/remonline-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryIds: syncAll ? [] : selectedCategories,
          syncAll,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSyncResult(result)
        toast.success(`Синхронізація завершена! Оброблено: ${result.processed}`)
      } else {
        toast.error(result.error || "Помилка синхронізації")
      }
    } catch (error) {
      console.error("Error syncing services:", error)
      toast.error("Помилка синхронізації")
    } finally {
      setSyncing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "updated":
        return <RefreshCw className="h-4 w-4 text-blue-500" />
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return <Badge className="bg-green-100 text-green-800">Створено</Badge>
      case "updated":
        return <Badge className="bg-blue-100 text-blue-800">Оновлено</Badge>
      case "skipped":
        return <Badge className="bg-yellow-100 text-yellow-800">Пропущено</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Помилка</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Завантаження...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Синхронізація послуг RemOnline
          </CardTitle>
          <CardDescription>
            Синхронізуйте послуги з RemOnline API. Максимум 3 запити на секунду, до 50 послуг за запит.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="sync-all" checked={syncAll} onCheckedChange={handleSyncAllToggle} />
              <label htmlFor="sync-all" className="text-sm font-medium">
                Синхронізувати всі послуги
              </label>
            </div>

            {!syncAll && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Оберіть категорії для синхронізації:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.category_id}`}
                        checked={selectedCategories.includes(category.category_id)}
                        onCheckedChange={(checked) => handleCategoryToggle(category.category_id, checked as boolean)}
                      />
                      <label htmlFor={`category-${category.category_id}`} className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{category.category_id}</Badge>
                        {category.category_title}
                      </label>
                    </div>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">Спочатку налаштуйте асоціації категорій</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Sync Button */}
          <div className="flex justify-center">
            <Button onClick={startSync} disabled={syncing || (!syncAll && selectedCategories.length === 0)} size="lg">
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Синхронізація...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Почати синхронізацію
                </>
              )}
            </Button>
          </div>

          {/* Sync Results */}
          {syncResult && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h4 className="text-lg font-semibold mb-4">Результати синхронізації</h4>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{syncResult.processed}</div>
                      <div className="text-sm text-muted-foreground">Оброблено</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{syncResult.created}</div>
                      <div className="text-sm text-muted-foreground">Створено</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{syncResult.updated}</div>
                      <div className="text-sm text-muted-foreground">Оновлено</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{syncResult.skipped}</div>
                      <div className="text-sm text-muted-foreground">Пропущено</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{syncResult.errors}</div>
                      <div className="text-sm text-muted-foreground">Помилки</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Details */}
                {syncResult.details.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3">Деталі ({syncResult.details.length})</h5>
                    <ScrollArea className="h-64 border rounded-md">
                      <div className="p-4 space-y-2">
                        {syncResult.details.map((detail, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(detail.status)}
                              <div>
                                <div className="font-medium">{detail.title}</div>
                                <div className="text-sm text-muted-foreground">ID: {detail.remonline_id}</div>
                                {detail.error && <div className="text-sm text-red-600">{detail.error}</div>}
                              </div>
                            </div>
                            <div>{getStatusBadge(detail.status)}</div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
