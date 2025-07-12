"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

type Service = {
  id: string
  slug: string
  name: string
  description: string
  position: number
  image_url?: string
  default_warranty_months: number
  default_duration_hours: number
}

type ModelService = {
  id: string
  model_id: string
  service_id: string
  price: number | null
  warranty_months: number | null
  duration_hours: number | null
  warranty_period: string
  detailed_description: string | null
  what_included: string | null
  benefits: string | null
  services: Service
}

type ModelServicesManagerProps = {
  modelId: string
  locale: string
}

export function ModelServicesManager({ modelId, locale }: ModelServicesManagerProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()

  const [modelServices, setModelServices] = useState<ModelService[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>("")
  const [formData, setFormData] = useState({
    price: "",
    warranty_months: "",
    duration_hours: "",
    warranty_period: "months",
    detailed_description: "",
    what_included: "",
    benefits: "",
  })
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch model services and all services
  useEffect(() => {
    fetchData()
  }, [modelId, locale])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all services using the same endpoint as the services management page
      console.log(`Fetching all services for locale ${locale}`)
      const servicesRes = await fetch(`/api/admin/services`)

      if (!servicesRes.ok) {
        const errorData = await servicesRes.json()
        console.error("Services error response:", errorData)
        throw new Error(`Failed to fetch services: ${servicesRes.status} - ${JSON.stringify(errorData)}`)
      }

      const servicesData = await servicesRes.json()
      console.log("All services data:", servicesData)

      // Transform services data to match expected format
      const transformedServices =
        servicesData.services?.map((service: any) => {
          // Find translation for current locale, fallback to first available
          const translation =
            service.services_translations?.find((t: any) => t.locale === locale) || service.services_translations?.[0]

          return {
            id: service.id,
            slug: service.slug,
            name: translation?.name || `Service ${service.id}`,
            description: translation?.description || "",
            position: service.position || 0,
            image_url: service.image_url,
            default_warranty_months: service.warranty_months || 0,
            default_duration_hours: service.duration_hours || 0,
          }
        }) || []

      // Sort by position
      transformedServices.sort((a: Service, b: Service) => a.position - b.position)

      console.log("Transformed services:", transformedServices)
      setAllServices(transformedServices)

      // Fetch model services
      console.log(`Fetching model services for model ${modelId} and locale ${locale}`)
      const modelServicesRes = await fetch(`/api/admin/model-services?model_id=${modelId}&locale=${locale}`)

      if (!modelServicesRes.ok) {
        const errorData = await modelServicesRes.json()
        console.error("Model services error response:", errorData)
        throw new Error(`Failed to fetch model services: ${modelServicesRes.status} - ${JSON.stringify(errorData)}`)
      }

      const modelServicesData = await modelServicesRes.json()
      console.log("Model services data:", modelServicesData)
      setModelServices(modelServicesData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch data")
      toast({
        title: "Помилка",
        description: "Помилка завантаження даних",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast({
      title: "Успіх",
      description: "Дані оновлено успішно",
    })
  }

  // Get services that are not already assigned to the model
  const availableServices = allServices.filter((service) => !modelServices.some((ms) => ms.service_id === service.id))

  const resetForm = () => {
    setFormData({
      price: "",
      warranty_months: "",
      duration_hours: "",
      warranty_period: "months",
      detailed_description: "",
      what_included: "",
      benefits: "",
    })
  }

  const handleAddService = async () => {
    if (!selectedService) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, оберіть послугу",
        variant: "destructive",
      })
      return
    }

    // Get default values from selected service
    const selectedServiceData = allServices.find((s) => s.id === selectedService)

    const serviceData = {
      modelId,
      serviceId: selectedService,
      price: formData.price.trim() === "" ? null : Number.parseFloat(formData.price),
      warranty_months:
        formData.warranty_months.trim() === ""
          ? selectedServiceData?.default_warranty_months
          : Number.parseInt(formData.warranty_months),
      duration_hours:
        formData.duration_hours.trim() === ""
          ? selectedServiceData?.default_duration_hours
          : Number.parseFloat(formData.duration_hours),
      warranty_period: formData.warranty_period,
      detailed_description: formData.detailed_description.trim() || null,
      what_included: formData.what_included.trim() || null,
      benefits: formData.benefits.trim() || null,
    }

    // Validate price if provided
    if (serviceData.price !== null && (isNaN(serviceData.price) || serviceData.price <= 0)) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, введіть правильну ціну",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Adding service:", serviceData)

      const res = await fetch("/api/admin/model-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Error response:", responseData)
        throw new Error(`Failed to add service: ${responseData.error || res.statusText}`)
      }

      console.log("Service added successfully:", responseData)
      await fetchData() // Refresh data
      resetForm()
      setSelectedService("")
      setIsDialogOpen(false)

      toast({
        title: "Успіх",
        description: "Послугу додано успішно",
      })
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: "Помилка",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Помилка додавання послуги",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditService = async () => {
    if (!editingServiceId) {
      toast({
        title: "Помилка валідації",
        description: "Послугу не обрано",
        variant: "destructive",
      })
      return
    }

    const modelService = modelServices.find((ms) => ms.id === editingServiceId)
    if (!modelService) {
      throw new Error("Model service not found")
    }

    const serviceData = {
      modelId,
      serviceId: modelService.service_id,
      price: formData.price.trim() === "" ? null : Number.parseFloat(formData.price),
      warranty_months: formData.warranty_months.trim() === "" ? null : Number.parseInt(formData.warranty_months),
      duration_hours: formData.duration_hours.trim() === "" ? null : Number.parseFloat(formData.duration_hours),
      warranty_period: formData.warranty_period,
      detailed_description: formData.detailed_description.trim() || null,
      what_included: formData.what_included.trim() || null,
      benefits: formData.benefits.trim() || null,
    }

    // Validate price if provided
    if (serviceData.price !== null && (isNaN(serviceData.price) || serviceData.price <= 0)) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, введіть правильну ціну",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Updating service:", serviceData)

      const res = await fetch("/api/admin/model-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Error response:", responseData)
        throw new Error(`Failed to update service: ${responseData.error || res.statusText}`)
      }

      console.log("Service updated successfully:", responseData)
      await fetchData() // Refresh data
      resetForm()
      setEditingServiceId(null)
      setIsDialogOpen(false)

      toast({
        title: "Успіх",
        description: "Послугу оновлено успішно",
      })
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: "Помилка",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Помилка оновлення послуги",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю послугу?")) return

    try {
      setIsSubmitting(true)
      console.log(`Deleting model service with ID: ${id}`)

      const res = await fetch(`/api/admin/model-services/${id}`, {
        method: "DELETE",
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Error response:", responseData)
        throw new Error(`Failed to delete service: ${responseData.error || res.statusText}`)
      }

      console.log("Service deleted successfully:", responseData)
      setModelServices(modelServices.filter((ms) => ms.id !== id))

      toast({
        title: "Успіх",
        description: "Послугу видалено успішно",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Помилка",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Помилка видалення послуги",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAddDialog = () => {
    setEditingServiceId(null)
    setSelectedService("")
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (modelService: ModelService) => {
    setEditingServiceId(modelService.id)
    setSelectedService(modelService.service_id)
    setFormData({
      price: modelService.price !== null ? modelService.price.toString() : "",
      warranty_months: modelService.warranty_months !== null ? modelService.warranty_months.toString() : "",
      duration_hours: modelService.duration_hours !== null ? modelService.duration_hours.toString() : "",
      warranty_period: modelService.warranty_period || "months",
      detailed_description: modelService.detailed_description || "",
      what_included: modelService.what_included || "",
      benefits: modelService.benefits || "",
    })
    setIsDialogOpen(true)
  }

  const renderPrice = (price: number | null) => {
    return price !== null ? formatCurrency(price) : "Ціна за запитом"
  }

  const renderWarranty = (months: number | null, period: string) => {
    if (!months) return "Не вказано"
    return period === "months" ? `${months} міс.` : `${months} дн.`
  }

  const renderDuration = (hours: number | null) => {
    if (!hours) return "Не вказано"
    return `${hours} год.`
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Керувати послугами моделі</h2>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Оновлення..." : "Оновити"}
          </Button>
          <Button onClick={openAddDialog} disabled={isSubmitting || availableServices.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Додати послугу
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Завантаження...</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p className="font-medium">Помилка завантаження даних:</p>
          </div>
          <p className="mt-2">{error}</p>
          <Button onClick={refreshData} variant="outline" className="mt-4 bg-transparent" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Повторна спроба..." : "Спробувати знову"}
          </Button>
        </div>
      ) : (
        <>
          {/* Debug info */}
          <div className="text-xs text-muted-foreground">
            Всього послуг: {allServices.length} | Доступних для додавання: {availableServices.length} | Вже додано:{" "}
            {modelServices.length}
          </div>

          {modelServices.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-muted-foreground">Для цієї моделі ще не додано жодної послуги.</p>
              <Button
                onClick={openAddDialog}
                className="mt-4"
                disabled={isSubmitting || availableServices.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Додати послугу
              </Button>
              {availableServices.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Немає доступних послуг для додавання. Спочатку створіть послуги в розділі "Послуги".
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва послуги</TableHead>
                  <TableHead>Опис</TableHead>
                  <TableHead className="text-right">Ціна</TableHead>
                  <TableHead>Гарантія</TableHead>
                  <TableHead>Тривалість</TableHead>
                  <TableHead className="w-[100px]">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelServices.map((modelService) => (
                  <TableRow key={modelService.id}>
                    <TableCell className="font-medium">{modelService.services?.name}</TableCell>
                    <TableCell className="max-w-md truncate">{modelService.services?.description}</TableCell>
                    <TableCell className="text-right">{renderPrice(modelService.price)}</TableCell>
                    <TableCell>{renderWarranty(modelService.warranty_months, modelService.warranty_period)}</TableCell>
                    <TableCell>{renderDuration(modelService.duration_hours)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(modelService)}
                          disabled={isSubmitting}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Редагувати</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(modelService.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Видалити</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Редагувати послугу" : "Додати послугу до моделі"}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? "Змініть параметри для цієї послуги" : "Оберіть послугу та встановіть параметри"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingServiceId && (
              <div className="grid gap-2">
                <Label htmlFor="service">Послуга</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть послугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Немає доступних послуг. Всі послуги вже додані до цієї моделі або немає створених послуг.
                      </div>
                    ) : (
                      availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-muted-foreground">{service.slug}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Ціна (грн)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="Ціна за запитом"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="warranty_months">Гарантія</Label>
                <div className="flex gap-2">
                  <Input
                    id="warranty_months"
                    type="number"
                    min="0"
                    value={formData.warranty_months}
                    onChange={(e) => setFormData((prev) => ({ ...prev, warranty_months: e.target.value }))}
                    placeholder="Кількість"
                  />
                  <Select
                    value={formData.warranty_period}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, warranty_period: value }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">міс.</SelectItem>
                      <SelectItem value="days">дн.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration_hours">Тривалість (години)</Label>
              <Input
                id="duration_hours"
                type="number"
                step="0.1"
                min="0"
                value={formData.duration_hours}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration_hours: e.target.value }))}
                placeholder="Тривалість роботи"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="detailed_description">Детальний опис</Label>
              <Textarea
                id="detailed_description"
                value={formData.detailed_description}
                onChange={(e) => setFormData((prev) => ({ ...prev, detailed_description: e.target.value }))}
                placeholder="Детальний опис послуги для цієї моделі"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="what_included">Що включено</Label>
              <Textarea
                id="what_included"
                value={formData.what_included}
                onChange={(e) => setFormData((prev) => ({ ...prev, what_included: e.target.value }))}
                placeholder="Що включено в послугу (по одному пункту на рядок)"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="benefits">Переваги</Label>
              <Textarea
                id="benefits"
                value={formData.benefits}
                onChange={(e) => setFormData((prev) => ({ ...prev, benefits: e.target.value }))}
                placeholder="Переваги послуги (по одному пункту на рядок)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Скасувати
            </Button>
            <Button
              onClick={editingServiceId ? handleEditService : handleAddService}
              disabled={isSubmitting || (!editingServiceId && !selectedService)}
            >
              {isSubmitting ? "Обробка..." : editingServiceId ? "Зберегти зміни" : "Додати послугу"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
