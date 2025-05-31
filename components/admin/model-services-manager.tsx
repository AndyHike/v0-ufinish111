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
  name: string
  description: string
  position: number
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

      // Fetch all services first
      console.log(`Fetching all services for locale ${locale}`)
      const servicesRes = await fetch(`/api/admin/services?locale=${locale}`)

      if (!servicesRes.ok) {
        const errorData = await servicesRes.json()
        console.error("Services error response:", errorData)
        throw new Error(`Failed to fetch services: ${servicesRes.status} - ${JSON.stringify(errorData)}`)
      }

      const servicesData = await servicesRes.json()
      console.log("All services data:", servicesData)
      setAllServices(servicesData)

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
        title: t("error"),
        description: t("errorFetchingData"),
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
      title: t("success"),
      description: "Data refreshed successfully",
    })
  }

  // Get services that are not already assigned to the model
  const availableServices = allServices.filter((service) => !modelServices.some((ms) => ms.service_id === service.id))

  const handleAddService = async () => {
    if (!selectedService) {
      toast({
        title: t("validationError"),
        description: t("pleaseSelectService"),
        variant: "destructive",
      })
      return
    }

    // Allow empty price (will be stored as null)
    const priceValue = price.trim() === "" ? null : Number.parseFloat(price)

    // If price is provided, validate it's a positive number
    if (priceValue !== null && (isNaN(priceValue) || priceValue <= 0)) {
      toast({
        title: t("validationError"),
        description: t("pleaseEnterValidPrice"),
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
        title: t("success"),
        description: t("serviceAddedSuccessfully"),
      })
    } catch (error) {
      console.error("Error adding service:", error)
      toast({
        title: t("error"),
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : t("errorAddingService"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditService = async () => {
    if (!editingServiceId) {
      toast({
        title: t("validationError"),
        description: t("serviceNotSelected"),
        variant: "destructive",
      })
      return
    }

    // Allow empty price (will be stored as null)
    const priceValue = price.trim() === "" ? null : Number.parseFloat(price)

    // If price is provided, validate it's a positive number
    if (priceValue !== null && (isNaN(priceValue) || priceValue <= 0)) {
      toast({
        title: t("validationError"),
        description: t("pleaseEnterValidPrice"),
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
        title: t("success"),
        description: t("serviceUpdatedSuccessfully"),
      })
    } catch (error) {
      console.error("Error updating service:", error)
      toast({
        title: t("error"),
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : t("errorUpdatingService"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm(t("confirmDeleteService"))) return

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
        title: t("success"),
        description: t("serviceDeletedSuccessfully"),
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: t("error"),
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : t("errorDeletingService"),
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
    return price !== null ? formatCurrency(price) : t("priceOnRequest")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">{t("manageModelServices")}</h2>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={openAddDialog} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addService")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">{t("loading")}</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            <p className="font-medium">Error loading data:</p>
          </div>
          <p className="mt-2">{error}</p>
          <Button onClick={refreshData} variant="outline" className="mt-4" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Retrying..." : "Retry"}
          </Button>
        </div>
      ) : modelServices.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("noServicesForModel")}</p>
          <Button onClick={openAddDialog} className="mt-4" disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addService")}
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("serviceName")}</TableHead>
              <TableHead>{t("serviceDescription")}</TableHead>
              <TableHead className="text-right">{t("price")}</TableHead>
              <TableHead className="w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelServices.map((modelService) => (
              <TableRow key={modelService.id}>
                <TableCell className="font-medium">{modelService.services?.name}</TableCell>
                <TableCell className="max-w-md truncate">{modelService.services?.description}</TableCell>
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
                      <span className="sr-only">{t("edit")}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteService(modelService.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("delete")}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingServiceId ? t("editServicePrice") : t("addServiceToModel")}</DialogTitle>
            <DialogDescription>
              {editingServiceId ? t("editServicePriceDescription") : t("addServiceToModelDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingServiceId && (
              <div className="grid gap-2">
                <label htmlFor="service">{t("service")}</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServices.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No available services. All services have been added to this model.
                      </div>
                    ) : (
                      availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="price">{t("price")}</label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t("priceOnRequest")}
              />
              <p className="text-xs text-muted-foreground">{t("leaveEmptyForPriceOnRequest")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button
              onClick={editingServiceId ? handleEditService : handleAddService}
              disabled={isSubmitting || (!editingServiceId && !selectedService)}
            >
              {isSubmitting ? t("processing") : editingServiceId ? t("saveChanges") : t("addService")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
