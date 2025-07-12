"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Save, AlertCircle, CheckCircle, Edit, Plus } from "lucide-react"

type ParsedService = {
  id: string
  slug: string | null
  brand: string | null
  series: string | null
  model: string | null
  price: number | null
  warranty_months: number | null
  warranty_period: "months" | "days" | null
  duration_hours: number | null
  original_description: string
  original_category: string
  service_found: boolean
  brand_found: boolean
  series_found: boolean
  model_found: boolean
  service_id: string | null
  brand_id: string | null
  series_id: string | null
  model_id: string | null
  errors: string[]
  needs_new_model: boolean
  suggested_model_name: string | null
}

type ImportSummary = {
  total: number
  with_errors: number
  services_found: number
  brands_found: number
  series_found: number
  models_found: number
  new_models_needed: number
}

type ImportOptions = {
  services: Array<{ id: string; name: string; slug: string }>
  brands: Array<{ id: string; name: string; slug: string }>
  series: Array<{ id: string; name: string; slug: string; brand_id: string }>
  models: Array<{ id: string; name: string; slug: string; brand_id: string; series_id: string | null }>
}

interface RemOnlineImportPreviewProps {
  services: ParsedService[]
  summary: ImportSummary | null
  onBack: () => void
  onSuccess: () => void
}

export function RemOnlineImportPreview({ services, summary, onBack, onSuccess }: RemOnlineImportPreviewProps) {
  const { toast } = useToast()
  const [editedServices, setEditedServices] = useState<ParsedService[]>(services)
  const [options, setOptions] = useState<ImportOptions | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/admin/bulk-import/options")
      if (response.ok) {
        const data = await response.json()
        setOptions(data)
      }
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }

  const updateService = (serviceId: string, field: string, value: any) => {
    setEditedServices((prev) =>
      prev.map((service) => {
        if (service.id === serviceId) {
          const updated = { ...service, [field]: value }

          // Update related IDs when selections change
          if (field === "service_id") {
            const foundService = options?.services.find((s) => s.id === value)
            updated.service_found = !!foundService
          } else if (field === "brand_id") {
            const foundBrand = options?.brands.find((b) => b.id === value)
            updated.brand_found = !!foundBrand
            updated.brand = foundBrand?.name || null
            // Reset series and model when brand changes
            updated.series_id = null
            updated.model_id = null
            updated.series_found = false
            updated.model_found = false
            updated.needs_new_model = false
          } else if (field === "series_id") {
            const foundSeries = options?.series.find((s) => s.id === value)
            updated.series_found = !!foundSeries
            updated.series = foundSeries?.name || null
            // Reset model when series changes
            updated.model_id = null
            updated.model_found = false
            updated.needs_new_model = false
          } else if (field === "model_id") {
            const foundModel = options?.models.find((m) => m.id === value)
            updated.model_found = !!foundModel
            updated.model = foundModel?.name || null
            updated.needs_new_model = false
          } else if (field === "suggested_model_name") {
            updated.needs_new_model = !!value
            updated.model_found = false
            updated.model_id = null
          }

          return updated
        }
        return service
      }),
    )
  }

  const getAvailableSeries = (brandId: string | null) => {
    if (!brandId || !options) return []
    return options.series.filter((s) => s.brand_id === brandId)
  }

  const getAvailableModels = (brandId: string | null, seriesId: string | null) => {
    if (!brandId || !options) return []
    return options.models.filter((m) => m.brand_id === brandId && (seriesId ? m.series_id === seriesId : true))
  }

  const canSave = editedServices.every(
    (service) =>
      service.service_id &&
      service.brand_id &&
      (service.model_id || (service.needs_new_model && service.suggested_model_name)),
  )

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: "Помилка",
        description: "Всі послуги повинні мати вибрану послугу, бренд та модель (або назву нової моделі)",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const servicesToSave = editedServices.map((service) => ({
        service_id: service.service_id,
        brand_id: service.brand_id,
        series_id: service.series_id,
        model_id: service.model_id,
        model_name: service.needs_new_model ? service.suggested_model_name : null,
        price: service.price,
        warranty_months: service.warranty_months,
        warranty_period: service.warranty_period,
        duration_hours: service.duration_hours,
      }))

      const response = await fetch("/api/admin/bulk-import/remonline-services/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesToSave }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Успіх",
          description: `Імпортовано ${result.success} послуг з ${servicesToSave.length}`,
        })
        onSuccess()
      } else {
        throw new Error(result.error || "Failed to save services")
      }
    } catch (error) {
      console.error("Error saving services:", error)
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти послуги",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h2 className="text-2xl font-bold">Попередній перегляд імпорту</h2>
        </div>
        <Button onClick={handleSave} disabled={!canSave || isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Збереження..." : "Зберегти всі"}
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Всього</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.with_errors}</div>
              <div className="text-sm text-muted-foreground">З помилками</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.services_found}</div>
              <div className="text-sm text-muted-foreground">Послуги знайдені</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.brands_found}</div>
              <div className="text-sm text-muted-foreground">Бренди знайдені</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.series_found}</div>
              <div className="text-sm text-muted-foreground">Серії знайдені</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.models_found}</div>
              <div className="text-sm text-muted-foreground">Моделі знайдені</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.new_models_needed}</div>
              <div className="text-sm text-muted-foreground">Нові моделі</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Послуги для імпорту ({editedServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Опис</TableHead>
                  <TableHead>Послуга</TableHead>
                  <TableHead>Бренд</TableHead>
                  <TableHead>Серія</TableHead>
                  <TableHead>Модель</TableHead>
                  <TableHead>Ціна</TableHead>
                  <TableHead>Гарантія (міс.)</TableHead>
                  <TableHead>Тривалість (год.)</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={service.original_description}>
                        {service.original_description}
                      </div>
                      <div className="text-xs text-muted-foreground">Slug: {service.slug || "Не знайдено"}</div>
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Select
                          value={service.service_id || ""}
                          onValueChange={(value) => updateService(service.id, "service_id", value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Вибрати послугу" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.services.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {service.service_found ? (
                            <Badge variant="default">
                              {options?.services.find((s) => s.id === service.service_id)?.name || service.slug}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Не знайдено</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Select
                          value={service.brand_id || ""}
                          onValueChange={(value) => updateService(service.id, "brand_id", value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Вибрати бренд" />
                          </SelectTrigger>
                          <SelectContent>
                            {options?.brands.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {service.brand_found ? (
                            <Badge variant="default">{service.brand}</Badge>
                          ) : (
                            <Badge variant="destructive">{service.brand || "Не знайдено"}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Select
                          value={service.series_id || ""}
                          onValueChange={(value) => updateService(service.id, "series_id", value)}
                          disabled={!service.brand_id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Вибрати серію" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSeries(service.brand_id).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>
                          {service.series ? (
                            <Badge variant={service.series_found ? "default" : "destructive"}>{service.series}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <div className="space-y-2">
                          {service.needs_new_model ? (
                            <Input
                              value={service.suggested_model_name || ""}
                              onChange={(e) => updateService(service.id, "suggested_model_name", e.target.value)}
                              placeholder="Назва нової моделі"
                              className="w-40"
                            />
                          ) : (
                            <Select
                              value={service.model_id || ""}
                              onValueChange={(value) => updateService(service.id, "model_id", value)}
                              disabled={!service.brand_id}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Вибрати модель" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableModels(service.brand_id, service.series_id).map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateService(service.id, "needs_new_model", !service.needs_new_model)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {service.needs_new_model ? "Вибрати існуючу" : "Створити нову"}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          {service.needs_new_model ? (
                            <Badge variant="secondary">
                              <Plus className="h-3 w-3 mr-1" />
                              {service.suggested_model_name}
                            </Badge>
                          ) : service.model_found ? (
                            <Badge variant="default">{service.model}</Badge>
                          ) : (
                            <Badge variant="destructive">{service.model || "Не знайдено"}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Input
                          type="number"
                          value={service.price || ""}
                          onChange={(e) =>
                            updateService(service.id, "price", Number.parseFloat(e.target.value) || null)
                          }
                          className="w-20"
                        />
                      ) : (
                        <span>{service.price ? `${service.price} ₴` : "-"}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={service.warranty_months || ""}
                          onChange={(e) =>
                            updateService(service.id, "warranty_months", Number.parseFloat(e.target.value) || null)
                          }
                          className="w-20"
                          placeholder="Місяці"
                        />
                      ) : (
                        <div className="text-sm">
                          {service.warranty_months ? `${service.warranty_months} міс.` : "-"}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingId === service.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={service.duration_hours || ""}
                          onChange={(e) =>
                            updateService(service.id, "duration_hours", Number.parseFloat(e.target.value) || null)
                          }
                          className="w-20"
                          placeholder="Години"
                        />
                      ) : (
                        <div className="text-sm">{service.duration_hours ? `${service.duration_hours} год.` : "-"}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      {service.errors.length > 0 ? (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Помилки
                        </Badge>
                      ) : service.service_found &&
                        service.brand_found &&
                        (service.model_found || service.needs_new_model) ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Готово
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Потребує налаштування</Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(editingId === service.id ? null : service.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editedServices.some((s) => s.errors.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Увага</AlertTitle>
          <AlertDescription>Деякі послуги мають помилки. Перевірте та виправте їх перед збереженням.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
