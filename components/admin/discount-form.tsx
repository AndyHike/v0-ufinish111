"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { DiscountScopeType, DiscountType } from "@/lib/discounts/types"

type Brand = {
  id: string
  name: string
}

type Series = {
  id: string
  name: string
  brand_id: string
}

type Model = {
  id: string
  name: string
  brand_id: string
  series_id: string | null
}

type Service = {
  id: string
  name: string
  slug: string
}

interface DiscountFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  submitting?: boolean
}

export function DiscountForm({ initialData, onSubmit, onCancel, submitting }: DiscountFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    code: initialData?.code || "",
    description: initialData?.description || "",
    discountType: (initialData?.discountType as DiscountType) || "percentage",
    discountValue: initialData?.discountValue || "",
    scopeType: (initialData?.scopeType as DiscountScopeType) || "all_services",
    serviceId: initialData?.serviceId || "",
    brandId: initialData?.brandId || "",
    seriesId: initialData?.seriesId || "",
    modelId: initialData?.modelId || "",
    isActive: initialData?.isActive ?? true,
    startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().split("T")[0] : "",
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split("T")[0] : "",
    maxUses: initialData?.maxUses || "",
    maxUsesPerUser: initialData?.maxUsesPerUser || "",
  })

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBrands()
    fetchServices()
  }, [])

  useEffect(() => {
    if (formData.brandId) {
      fetchSeries(formData.brandId)
    } else {
      setSeries([])
      setModels([])
      setFormData((prev) => ({ ...prev, seriesId: "", modelId: "" }))
    }
  }, [formData.brandId])

  useEffect(() => {
    if (formData.seriesId) {
      fetchModels(formData.brandId, formData.seriesId)
    } else if (formData.brandId) {
      fetchModels(formData.brandId)
    } else {
      setModels([])
      setFormData((prev) => ({ ...prev, modelId: "" }))
    }
  }, [formData.seriesId, formData.brandId])

  async function fetchBrands() {
    try {
      const response = await fetch("/api/admin/brands")
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  async function fetchSeries(brandId: string) {
    try {
      const response = await fetch(`/api/admin/series?brand_id=${brandId}`)
      const data = await response.json()
      setSeries(data)
    } catch (error) {
      console.error("Error fetching series:", error)
    }
  }

  async function fetchModels(brandId?: string, seriesId?: string) {
    try {
      let url = "/api/admin/models?"
      if (brandId) url += `brand_id=${brandId}&`
      if (seriesId) url += `series_id=${seriesId}&`

      const response = await fetch(url)
      const data = await response.json()
      setModels(data)
    } catch (error) {
      console.error("Error fetching models:", error)
    }
  }

  async function fetchServices() {
    try {
      const response = await fetch("/api/admin/services")
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  function handleScopeTypeChange(value: DiscountScopeType) {
    setFormData({
      ...formData,
      scopeType: value,
      serviceId: "",
      brandId: "",
      seriesId: "",
      modelId: "",
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        discountValue: Number.parseFloat(formData.discountValue as string),
        maxUses: formData.maxUses ? Number.parseInt(formData.maxUses as string) : null,
        maxUsesPerUser: formData.maxUsesPerUser ? Number.parseInt(formData.maxUsesPerUser as string) : null,
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt || null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Назва знижки *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Наприклад: Знижка на заміну батареї"
            required
          />
        </div>

        <div>
          <Label htmlFor="code">Код знижки *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="BATTERY20"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Активна</Label>
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Опис</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Опис знижки..."
          />
        </div>

        <div>
          <Label htmlFor="discountType">Тип знижки *</Label>
          <Select
            value={formData.discountType}
            onValueChange={(value) => setFormData({ ...formData, discountType: value as DiscountType })}
          >
            <SelectTrigger id="discountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Відсоток (%)</SelectItem>
              <SelectItem value="fixed">Фіксована сума (CZK)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="discountValue">
            Розмір знижки * {formData.discountType === "percentage" ? "(%)" : "(CZK)"}
          </Label>
          <Input
            id="discountValue"
            type="number"
            min="0"
            step={formData.discountType === "percentage" ? "1" : "0.01"}
            max={formData.discountType === "percentage" ? "100" : undefined}
            value={formData.discountValue}
            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
            placeholder={formData.discountType === "percentage" ? "15" : "500"}
            required
          />
          {formData.discountType === "percentage" && (
            <p className="text-xs text-muted-foreground mt-1">
              Ціна буде округлена до найближчих 90 (наприклад: 1290, 1390, 1490)
            </p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="scopeType">Застосування знижки *</Label>
          <Select value={formData.scopeType} onValueChange={handleScopeTypeChange}>
            <SelectTrigger id="scopeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_services">Всі послуги</SelectItem>
              <SelectItem value="all_models">Всі моделі</SelectItem>
              <SelectItem value="service">Конкретна послуга</SelectItem>
              <SelectItem value="brand">Всі пристрої бренду</SelectItem>
              <SelectItem value="series">Всі моделі серії</SelectItem>
              <SelectItem value="model">Конкретна модель</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.scopeType === "service" && (
          <div className="col-span-2">
            <Label htmlFor="serviceId">Оберіть послугу *</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
            >
              <SelectTrigger id="serviceId">
                <SelectValue placeholder="Оберіть послугу" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(formData.scopeType === "brand" || formData.scopeType === "series" || formData.scopeType === "model") && (
          <div className="col-span-2">
            <Label htmlFor="brandId">Оберіть бренд *</Label>
            <Select
              value={formData.brandId}
              onValueChange={(value) => setFormData({ ...formData, brandId: value, seriesId: "", modelId: "" })}
            >
              <SelectTrigger id="brandId">
                <SelectValue placeholder="Оберіть бренд" />
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
        )}

        {(formData.scopeType === "series" || formData.scopeType === "model") && formData.brandId && (
          <div className="col-span-2">
            <Label htmlFor="seriesId">Оберіть серію {formData.scopeType === "series" && "*"}</Label>
            <Select
              value={formData.seriesId}
              onValueChange={(value) => setFormData({ ...formData, seriesId: value, modelId: "" })}
            >
              <SelectTrigger id="seriesId">
                <SelectValue placeholder="Оберіть серію (опційно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_series">Всі серії</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.scopeType === "model" && formData.brandId && (
          <div className="col-span-2">
            <Label htmlFor="modelId">Оберіть модель *</Label>
            <Select value={formData.modelId} onValueChange={(value) => setFormData({ ...formData, modelId: value })}>
              <SelectTrigger id="modelId">
                <SelectValue placeholder="Оберіть модель" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="startsAt">Дата початку</Label>
          <Input
            id="startsAt"
            type="date"
            value={formData.startsAt}
            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="expiresAt">Дата закінчення</Label>
          <Input
            id="expiresAt"
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="maxUses">Макс. використань</Label>
          <Input
            id="maxUses"
            type="number"
            min="0"
            value={formData.maxUses}
            onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            placeholder="Необмежено"
          />
        </div>

        <div>
          <Label htmlFor="maxUsesPerUser">Макс. на користувача</Label>
          <Input
            id="maxUsesPerUser"
            type="number"
            min="0"
            value={formData.maxUsesPerUser}
            onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
            placeholder="Необмежено"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading || submitting}>
          Скасувати
        </Button>
        <Button type="submit" disabled={loading || submitting}>
          {loading || submitting ? "Збереження..." : initialData ? "Оновити" : "Створити"}
        </Button>
      </div>
    </form>
  )
}
