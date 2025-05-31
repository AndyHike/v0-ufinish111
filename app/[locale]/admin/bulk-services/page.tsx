"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Save, Plus, Trash, AlertCircle, FileSpreadsheet, RefreshCw } from "lucide-react"
import { CSVLink } from "react-csv"

type Brand = {
  id: string
  name: string
}

type Model = {
  id: string
  name: string
  brand_id: string
  brands?: {
    name: string
  }
}

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

export default function BulkServicesPage() {
  const t = useTranslations("Admin")
  const { toast } = useToast()

  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [modelServices, setModelServices] = useState<ModelService[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])

  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("services")
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    Promise.all([fetchBrands(), fetchServices(), fetchModels()])
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message || "Failed to load initial data")
        setLoading(false)
      })
  }, [])

  // Filter models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      setFilteredModels(models.filter((model) => model.brand_id === selectedBrand))
    } else {
      setFilteredModels([])
    }
    setSelectedModel("")
  }, [selectedBrand, models])

  // Load model services when model changes
  useEffect(() => {
    if (selectedModel) {
      fetchModelServices(selectedModel)
    } else {
      setModelServices([])
    }
  }, [selectedModel])

  async function fetchBrands() {
    try {
      const response = await fetch("/api/admin/brands")
      if (!response.ok) throw new Error("Failed to fetch brands")
      const data = await response.json()
      setBrands(data)
      return data
    } catch (err) {
      console.error("Error fetching brands:", err)
      throw err
    }
  }

  async function fetchModels() {
    try {
      const response = await fetch("/api/admin/models")
      if (!response.ok) throw new Error("Failed to fetch models")
      const data = await response.json()
      setModels(data)
      return data
    } catch (err) {
      console.error("Error fetching models:", err)
      throw err
    }
  }

  async function fetchServices() {
    try {
      const locale = document.documentElement.lang || "uk"
      const response = await fetch(`/api/admin/services?locale=${locale}`)
      if (!response.ok) throw new Error("Failed to fetch services")
      const data = await response.json()
      setServices(data)
      return data
    } catch (err) {
      console.error("Error fetching services:", err)
      throw err
    }
  }

  async function fetchModelServices(modelId: string) {
    try {
      setModelServices([]) // Clear previous data
      const locale = document.documentElement.lang || "uk"
      const response = await fetch(`/api/admin/model-services?model_id=${modelId}&locale=${locale}`)
      if (!response.ok) throw new Error("Failed to fetch model services")
      const data = await response.json()
      setModelServices(data)
    } catch (err) {
      console.error("Error fetching model services:", err)
      setError("Failed to load service prices")
    }
  }

  async function refreshData() {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchBrands(), fetchModels(), fetchServices()])
      if (selectedModel) {
        await fetchModelServices(selectedModel)
      }
      toast({
        title: t("success"),
        description: "Data refreshed successfully",
      })
    } catch (err) {
      console.error("Error refreshing data:", err)
      toast({
        title: t("error"),
        description: "Failed to refresh data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handlePriceChange(serviceId: string, price: string) {
    // Update price in local state
    setModelServices((prev) =>
      prev.map((ms) => (ms.service_id === serviceId ? { ...ms, price: price === "" ? null : Number(price) } : ms)),
    )
  }

  async function saveAllPrices() {
    if (!selectedModel) return

    setSaving(true)
    try {
      // Create an array of promises for each service update
      const updatePromises = modelServices.map((ms) =>
        fetch("/api/admin/model-services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId: selectedModel,
            serviceId: ms.service_id,
            price: ms.price,
          }),
        }),
      )

      // Wait for all updates to complete
      await Promise.all(updatePromises)

      toast({
        title: t("success"),
        description: "Prices updated successfully",
      })
    } catch (err) {
      console.error("Error saving prices:", err)
      toast({
        title: t("error"),
        description: "Failed to update prices",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function prepareExportData() {
    // Prepare data for CSV export
    const exportData = []

    // Add header row
    exportData.push(["Brand", "Model", "Service", "Price"])

    // Add data rows
    for (const model of models) {
      const brand = brands.find((b) => b.id === model.brand_id)
      if (!brand) continue

      // Find all services for this model
      const modelServiceData = modelServices.filter((ms) => ms.model_id === model.id)

      for (const ms of modelServiceData) {
        const service = services.find((s) => s.id === ms.service_id)
        if (!service) continue

        exportData.push([brand.name, model.name, service.name, ms.price === null ? "Price on request" : ms.price])
      }
    }

    setCsvData(exportData)
    return exportData
  }

  function addNewService() {
    if (!selectedModel || !selectedService) return

    // Check if service already exists for this model
    const exists = modelServices.some((ms) => ms.service_id === selectedService)
    if (exists) {
      toast({
        title: t("error"),
        description: "This service already exists for this model",
        variant: "destructive",
      })
      return
    }

    // Find the service details
    const serviceDetails = services.find((s) => s.id === selectedService)
    if (!serviceDetails) return

    // Add to local state
    setModelServices((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`, // Temporary ID until saved
        model_id: selectedModel,
        service_id: selectedService,
        price: null,
        services: serviceDetails,
      },
    ])

    setSelectedService("")
  }

  function removeService(serviceId: string) {
    // Check if it's a temporary service (not yet saved)
    const service = modelServices.find((ms) => ms.service_id === serviceId)
    if (!service) return

    if (service.id.startsWith("temp_")) {
      // Just remove from local state
      setModelServices((prev) => prev.filter((ms) => ms.service_id !== serviceId))
      return
    }

    // Otherwise, confirm deletion
    if (confirm("Are you sure you want to delete this service?")) {
      fetch(`/api/admin/model-services/${service.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) throw new Error("Failed to delete service")
          setModelServices((prev) => prev.filter((ms) => ms.service_id !== serviceId))
          toast({
            title: t("success"),
            description: "Service deleted successfully",
          })
        })
        .catch((err) => {
          console.error("Error deleting service:", err)
          toast({
            title: t("error"),
            description: "Failed to delete service",
            variant: "destructive",
          })
        })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Service Management</h1>
          <p className="text-muted-foreground">Manage multiple services and prices at once</p>
        </div>
        <Button onClick={refreshData} variant="outline" disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="services">Service Prices</TabsTrigger>
          <TabsTrigger value="export">Export/Import</TabsTrigger>
        </TabsList>

        {/* Service Prices Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Service Prices</CardTitle>
              <CardDescription>Update prices for multiple services at once</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 mb-6 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Brand</label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Model</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={!selectedBrand || filteredModels.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !selectedBrand
                            ? "Select Brand First"
                            : filteredModels.length === 0
                              ? "No Models for this Brand"
                              : "Select Model"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={saveAllPrices}
                    disabled={!selectedModel || modelServices.length === 0 || saving}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save All Prices"}
                  </Button>
                </div>
              </div>

              {selectedModel && (
                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Add Service</label>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services
                            .filter((service) => !modelServices.some((ms) => ms.service_id === service.id))
                            .map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addNewService} disabled={!selectedService}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : error ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
                      <div className="flex items-center">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        <p className="font-medium">Error loading data:</p>
                      </div>
                      <p className="mt-2">{error}</p>
                    </div>
                  ) : modelServices.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No services for this model</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modelServices.map((ms) => (
                          <TableRow key={ms.service_id}>
                            <TableCell className="font-medium">{ms.services?.name}</TableCell>
                            <TableCell className="max-w-md truncate">{ms.services?.description}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ms.price === null ? "" : ms.price}
                                onChange={(e) => handlePriceChange(ms.service_id, e.target.value)}
                                placeholder="Price on request"
                                className="w-32"
                              />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeService(ms.service_id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export/Import Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export/Import Data</CardTitle>
              <CardDescription>Export service data to CSV or import from CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Services</CardTitle>
                    <CardDescription>Export all service prices to CSV</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={prepareExportData} disabled={isExporting} className="w-full mb-4">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Prepare Export Data
                    </Button>

                    {csvData.length > 0 && (
                      <CSVLink
                        data={csvData}
                        filename={`service_prices_export_${new Date().toISOString().split("T")[0]}.csv`}
                        className="w-full"
                      >
                        <Button className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download CSV
                        </Button>
                      </CSVLink>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Import Services</CardTitle>
                    <CardDescription>Import service prices from CSV</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 border-2 border-dashed rounded-lg">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-lg font-semibold">CSV Import Coming Soon</h3>
                      <p className="mt-1 text-sm text-muted-foreground">This feature is under development</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
