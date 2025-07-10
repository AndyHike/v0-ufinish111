"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Download, XCircle, Zap, Clock, AlertTriangle } from "lucide-react"
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
  phase: string
  total_services: number
  fetched_services: number
  parsed_services: number
  processed_services: number
  created_services: number
  updated_services: number
  error_services: number
  services_needing_review: number
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

  const getPhaseProgress = () => {
    if (!currentSession) return 0

    switch (currentSession.phase) {
      case "fetching":
        return Math.min(25, (currentSession.fetched_services / Math.max(currentSession.total_services, 1)) * 25)
      case "parsing":
        return 25 + Math.min(25, (currentSession.parsed_services / Math.max(currentSession.total_services, 1)) * 25)
      case "processing":
        return 50 + Math.min(50, (currentSession.processed_services / Math.max(currentSession.total_services, 1)) * 50)
      case "completed":
        return 100
      default:
        return 0
    }
  }

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case "fetching":
        return "Отримання послуг з RemOnline"
      case "parsing":
        return "Аналіз штрихкодів та співставлення"
      case "processing":
        return "Збереження в базу даних"
      case "completed":
        return "Завершено"
      default:
        return phase
    }
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
            Двоетапний процес: спочатку отримання всіх послуг, потім аналіз та розподіл по брендам/серіям/моделям
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

                {/* Phase Progress */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Фаза: {getPhaseText(currentSession.phase)}</span>
                    <span>{Math.round(getPhaseProgress())}%</span>
                  </div>
                  <Progress value={getPhaseProgress()} className="h-2" />
                  {currentSession.current_service_title && (
                    <p className="text-sm text-muted-foreground">{currentSession.current_service_title}</p>
                  )}
                </div>

                {/* Phase Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className={currentSession.phase === "fetching" ? "ring-2 ring-blue-500" : ""}>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {currentSession.fetched_services} / {currentSession.total_services}
                      </div>
                      <div className="text-sm text-muted-foreground">Отримано з API</div>
                    </CardContent>
                  </Card>
                  <Card className={currentSession.phase === "parsing" ? "ring-2 ring-yellow-500" : ""}>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-yellow-600">
                        {currentSession.parsed_services} / {currentSession.total_services}
                      </div>
                      <div className="text-sm text-muted-foreground">Проаналізовано</div>
                    </CardContent>
                  </Card>
                  <Card className={currentSession.phase === "processing" ? "ring-2 ring-green-500" : ""}>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold text-green-600">
                        {currentSession.processed_services} / {currentSession.total_services}
                      </div>
                      <div className="text-sm text-muted-foreground">Збережено</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{currentSession.created_services}</div>
                      <div className="text-sm text-muted-foreground">Створено</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentSession.updated_services}</div>
                      <div className="text-sm text-muted-foreground">Оновлено</div>
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
                      <div className="text-2xl font-bold text-orange-600">{currentSession.services_needing_review}</div>
                      <div className="text-sm text-muted-foreground">Потребують перевірки</div>
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

                {/* Warning about services needing review */}
                {currentSession.services_needing_review > 0 && currentSession.status === "completed" && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800">Увага!</p>
                        <p className="text-sm text-orange-700">
                          {currentSession.services_needing_review} послуг потребують ручної перевірки. Перейдіть на
                          вкладку "Перевірка послуг" для налаштування.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
