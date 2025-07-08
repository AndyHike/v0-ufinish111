"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  warranty_months: number
  duration_hours: number
}

type ModelService = {
  id: string
  model_id: string
  service_id: string
  price: number | null
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
  const [price, setPrice] = useState<string>("")
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
            warranty_months: service.warranty_months || 0,
            duration_hours: service.duration_hours || 0,
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

  console.log("Available services for selection:", availableServices)
  console.log("All services:", allServices)
  console.log("Model services:", modelServices)

  const handleAddService = async () => {
    if (!selectedService) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, оберіть послугу",
        variant: "destructive",
      })
      return
    }

    // Allow empty price (will be stored as null)
    const priceValue = price.trim() === "" ? null : Number.parseFloat(price)

    // If price is provided, validate it's a positive number
    if (priceValue !== null && (isNaN(priceValue) || priceValue <= 0)) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, введіть правильну ціну",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Adding service:", { modelId, serviceId: selectedService, price: priceValue })

      const res = await fetch("/api/admin/model-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          serviceId: selectedService,
          price: priceValue,
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Error response:", responseData)
        throw new Error(`Failed to add service: ${responseData.error || res.statusText}`)
      }

      console.log("Service added successfully:", responseData)

      // Find the service details
      const serviceDetails = allServices.find((s) => s.id === selectedService)

      if (serviceDetails) {
        // Add the new model service to the list
        const updatedServices = [
          ...modelServices,
          {
            ...responseData,
            services: serviceDetails,
          },
        ]

        console.log("Updated services list:", updatedServices)
        setModelServices(updatedServices)
      } else {
        console.error("Service details not found for ID:", selectedService)
        // Refresh the data to ensure we have the latest
        await fetchData()
      }

      // Reset form
      setSelectedService("")
      setPrice("")
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

    // Allow empty price (will be stored as null)
    const priceValue = price.trim() === "" ? null : Number.parseFloat(price)

    // If price is provided, validate it's a positive number
    if (priceValue !== null && (isNaN(priceValue) || priceValue <= 0)) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, введіть правильну ціну",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      const modelService = modelServices.find((ms) => ms.id === editingServiceId)
      if (!modelService) {
        throw new Error("Model service not found")
      }

      console.log("Updating service:", { modelId, serviceId: modelService.service_id, price: priceValue })

      const res = await fetch("/api/admin/model-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          serviceId: modelService.service_id,
          price: priceValue,
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Error response:", responseData)
        throw new Error(`Failed to update service: ${responseData.error || res.statusText}`)
      }

      console.log("Service updated successfully:", responseData)

      // Update the model service in the list
      setModelServices(modelServices.map((ms) => (ms.id === editingServiceId ? { ...ms, price: priceValue } : ms)))

      // Reset form
      setEditingServiceId(null)
      setPrice("")
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

      // Remove the model service from the list
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
    setPrice("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (modelService: ModelService) => {
    setEditingServiceId(modelService.id)
    setSelectedService(modelService.service_id)
    setPrice(modelService.price !== null ? modelService.price.toString() : "")
    setIsDialogOpen(true)
  }

  const renderPrice = (price: number | null) => {
    return price !== null ? formatCurrency(price) : "Ціна за запитом"
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
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Ціна</TableHead>
                  <TableHead className="w-[100px]">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modelServices.map((modelService) => (
                  <TableRow key={modelService.id}>
                    <TableCell className="font-medium">{modelService.services?.name}</TableCell>
                    <TableCell className="max-w-md truncate">{modelService.services?.description}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{modelService.services?.slug}</code>
                    </TableCell>
                    <TableCell className="text-right">{renderPrice(modelService.price)}</TableCell>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingServiceId ? "Редагувати ціну послуги" : "Додати послугу до моделі"}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? "Змініть ціну для цієї послуги" : "Оберіть послугу та встановіть ціну"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingServiceId && (
              <div className="grid gap-2">
                <label htmlFor="service">Послуга</label>
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
                {availableServices.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Доступно {availableServices.length} послуг для додавання
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="price">Ціна (грн)</label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ціна за запитом"
              />
              <p className="text-xs text-muted-foreground">Залиште порожнім для "Ціна за запитом"</p>
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
