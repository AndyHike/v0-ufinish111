"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, AlertTriangle, CheckCircle, Edit, Save, X } from "lucide-react"
import { toast } from "sonner"

interface RemOnlineService {
  id: string
  remonline_id: number
  title: string
  barcode: string
  parsed_service_slug?: string
  parsed_brand_slug?: string
  parsed_series_slug?: string
  parsed_model_slug?: string
  service_slug_found: boolean
  brand_slug_found: boolean
  series_slug_found: boolean
  model_slug_found: boolean
  needs_review: boolean
  service?: { id: string; slug: string; name: string }
  brand?: { id: string; slug: string; name: string }
  series?: { id: string; slug: string; name: string }
  model?: { id: string; slug: string; name: string }
}

interface SelectOption {
  id: string
  slug: string
  name: string
}

export function RemOnlineServicesReview() {
  const [services, setServices] = useState<RemOnlineService[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [availableServices, setAvailableServices] = useState<SelectOption[]>([])
  const [availableBrands, setAvailableBrands] = useState<SelectOption[]>([])
  const [availableSeries, setAvailableSeries] = useState<SelectOption[]>([])
  const [availableModels, setAvailableModels] = useState<SelectOption[]>([])
  const [editForm, setEditForm] = useState({
    service_id: "",
    brand_id: "",
    series_id: "",
    model_id: "",
  })

  useEffect(() => {
    fetchServices()
    fetchOptions()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchServices()
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [search])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        needs_review: "true",
        limit: "100",
      })

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`/api/admin/remonline-services?${params}`)
      const data = await response.json()

      if (response.ok) {
        setServices(data.services || [])
      } else {
        toast.error("Помилка завантаження послуг")
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Помилка завантаження послуг")
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      // Fetch services
      const servicesResponse = await fetch("/api/services")
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setAvailableServices(servicesData.services || [])
      }

      // Fetch brands
      const brandsResponse = await fetch("/api/brands")
      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json()
        setAvailableBrands(brandsData.brands || [])
      }

      // Fetch series
      const seriesResponse = await fetch("/api/series")
      if (seriesResponse.ok) {
        const seriesData = await seriesResponse.json()
        setAvailableSeries(seriesData.series || [])
      }

      // Fetch models
      const modelsResponse = await fetch("/api/models")
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        setAvailableModels(modelsData.models || [])
      }
    } catch (error) {
      console.error("Error fetching options:", error)
    }
  }

  const handleEdit = (service: RemOnlineService) => {
    setEditingId(service.id)
    setEditForm({
      service_id: service.service?.id || "",
      brand_id: service.brand?.id || "",
      series_id: service.series?.id || "",
      model_id: service.model?.id || "",
    })
  }

  const handleSave = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/remonline-services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          needs_review: false,
        }),
      })

      if (response.ok) {
        toast.success("Послугу оновлено")
        fetchServices()
        setEditingId(null)
      } else {
        toast.error("Помилка оновлення")
      }
    } catch (error) {
      console.error("Error saving service:", error)
      toast.error("Помилка оновлення")
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({
      service_id: "",
      brand_id: "",
      series_id: "",
      model_id: "",
    })
  }

  const getStatusBadge = (service: RemOnlineService) => {
    if (!service.service_slug_found) {
      return <Badge variant="destructive">Послуга не знайдена</Badge>
    }
    if (!service.brand_slug_found || !service.series_slug_found || !service.model_slug_found) {
      return <Badge variant="secondary">Неповне співставлення</Badge>
    }
    return <Badge variant="default">Потребує перевірки</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Перевірка послуг RemOnline
          </CardTitle>
          <CardDescription>
            Послуги, які потребують ручної перевірки та налаштування співставлення з брендами/серіями/моделями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по назві або штрихкоду..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">{services.length} послуг потребують перевірки</Badge>
          </div>

          <Separator />

          {/* Services List */}
          {loading ? (
            <div className="text-center py-8">Завантаження...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Всі послуги перевірено! 🎉</p>
              <p className="text-sm">Немає послуг, які потребують ручної перевірки.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {services.map((service) => (
                  <Card key={service.id} className="p-4">
                    <div className="space-y-4">
                      {/* Service Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{service.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {service.remonline_id}</p>
                          {service.barcode && (
                            <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">{service.barcode}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(service)}
                          {editingId === service.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleSave(service.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Parsed Information */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-muted-foreground">Послуга:</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={service.service_slug_found ? "text-green-600" : "text-red-600"}>
                              {service.parsed_service_slug || "Не знайдено"}
                            </span>
                            {service.service_slug_found ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Бренд:</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={service.brand_slug_found ? "text-green-600" : "text-orange-600"}>
                              {service.parsed_brand_slug || "Не знайдено"}
                            </span>
                            {service.brand_slug_found ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Серія:</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={service.series_slug_found ? "text-green-600" : "text-orange-600"}>
                              {service.parsed_series_slug || "Не знайдено"}
                            </span>
                            {service.series_slug_found ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Модель:</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={service.model_slug_found ? "text-green-600" : "text-orange-600"}>
                              {service.parsed_model_slug || "Не знайдено"}
                            </span>
                            {service.model_slug_found ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit Form */}
                      {editingId === service.id && (
                        <div className="border-t pt-4">
                          <h5 className="font-medium mb-3">Налаштування співставлення:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium">Послуга</label>
                              <Select
                                value={editForm.service_id}
                                onValueChange={(value) => setEditForm({ ...editForm, service_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть послугу" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableServices.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.name} ({option.slug})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Бренд</label>
                              <Select
                                value={editForm.brand_id}
                                onValueChange={(value) => setEditForm({ ...editForm, brand_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть бренд" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableBrands.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.name} ({option.slug})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Серія</label>
                              <Select
                                value={editForm.series_id}
                                onValueChange={(value) => setEditForm({ ...editForm, series_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть серію" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableSeries.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.name} ({option.slug})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Модель</label>
                              <Select
                                value={editForm.model_id}
                                onValueChange={(value) => setEditForm({ ...editForm, model_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть модель" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableModels.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.name} ({option.slug})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
