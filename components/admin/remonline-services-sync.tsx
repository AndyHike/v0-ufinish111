"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Download, XCircle, Zap, Clock } from "lucide-react"
import { toast } from "sonner"

interface RemOnlineCategory {
  id: string
  category_id: number
  category_title: string
  description?: string
}

interface SyncSession {
  id: string
  session_id: string
  total_services: number
  processed_services: number
  created_services: number
  updated_services: number
  error_services: number
  created_brands: number
  created_series: number
  created_models: number
  status: string
  current_service_title?: string
  error_message?: string
  started_at: string
  completed_at?: string
}

export function RemOnlineServicesSync() {
  const [categories, setCategories] = useState<RemOnlineCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [syncAll, setSyncAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [currentSession, setCurrentSession] = useState<SyncSession | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  // Poll for session updates when syncing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (syncing && sessionId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/admin/sync/remonline-services/${sessionId}`)
          const data = await response.json()

          if (response.ok && data.session) {
            setCurrentSession(data.session)

            // Stop polling if completed or error
            if (data.session.status === "completed" || data.session.status === "error") {
              setSyncing(false)
              if (data.session.status === "completed") {
                toast.success("Синхронізація завершена успішно!")
              } else {
                toast.error("Синхронізація завершена з помилкою")
              }
            }
          }
        } catch (error) {
          console.error("Error polling session:", error)
        }
      }, 1000) // Poll every second
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [syncing, sessionId])

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
      setCurrentSession(null)

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
        setSessionId(result.sessionId)
        toast.success("Синхронізація розпочата!")
      } else {
        setSyncing(false)
        toast.error(result.error || "Помилка початку синхронізації")
      }
    } catch (error) {
      console.error("Error starting sync:", error)
      setSyncing(false)
      toast.error("Помилка початку синхронізації")
    }
  }

  const getProgress = () => {
    if (!currentSession || currentSession.total_services === 0) return 0
    return Math.round((currentSession.processed_services / currentSession.total_services) * 100)
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)

    if (duration < 60) return `${duration}с`
    if (duration < 3600) return `${Math.floor(duration / 60)}хв ${duration % 60}с`
    return `${Math.floor(duration / 3600)}год ${Math.floor((duration % 3600) / 60)}хв`
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
            Синхронізуйте послуги з RemOnline API з автоматичним створенням брендів, серій та моделей
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="sync-all" checked={syncAll} onCheckedChange={handleSyncAllToggle} disabled={syncing} />
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
                        disabled={syncing}
                      />
                      <label htmlFor={`category-${category.category_id}`} className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{category.category_id}</Badge>
                        <span>{category.category_title}</span>
                        {category.description && (
                          <span className="text-muted-foreground">({category.description})</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">Спочатку додайте категорії на вкладці "Категорії"</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Sync Button */}
          <div className="flex justify-center">
            <Button
              onClick={startSync}
              disabled={syncing || (!syncAll && selectedCategories.length === 0)}
              size="lg"
              className="min-w-[200px]"
            >
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

          {/* Real-time Progress */}
          {currentSession && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Прогрес синхронізації
                </h4>

                {/* Progress Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>
                      Оброблено: {currentSession.processed_services} / {currentSession.total_services}
                    </span>
                    <span>{getProgress()}%</span>
                  </div>
                  <Progress value={getProgress()} className="h-2" />
                  {currentSession.current_service_title && (
                    <p className="text-sm text-muted-foreground">
                      Поточна послуга: {currentSession.current_service_title}
                    </p>
                  )}
                </div>

                {/* Real-time Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{currentSession.created_services}</div>
                      <div className="text-sm text-muted-foreground">Створено послуг</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentSession.updated_services}</div>
                      <div className="text-sm text-muted-foreground">Оновлено послуг</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{currentSession.error_services}</div>
                      <div className="text-sm text-muted-foreground">Помилки</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentSession.created_brands + currentSession.created_series + currentSession.created_models}
                      </div>
                      <div className="text-sm text-muted-foreground">Створено об'єктів</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Hierarchy Creation Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-orange-600">{currentSession.created_brands}</div>
                      <div className="text-sm text-muted-foreground">Нових брендів</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-teal-600">{currentSession.created_series}</div>
                      <div className="text-sm text-muted-foreground">Нових серій</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-indigo-600">{currentSession.created_models}</div>
                      <div className="text-sm text-muted-foreground">Нових моделей</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Session Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>Статус: {currentSession.status === "running" ? "Виконується" : "Завершено"}</span>
                    <span>Тривалість: {formatDuration(currentSession.started_at, currentSession.completed_at)}</span>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {currentSession.session_id}
                  </Badge>
                </div>

                {/* Error Message */}
                {currentSession.error_message && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Помилка синхронізації:</p>
                        <p className="text-sm text-red-700">{currentSession.error_message}</p>
                      </div>
                    </div>
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
