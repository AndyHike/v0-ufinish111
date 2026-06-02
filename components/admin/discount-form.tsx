"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import type { DiscountScopeType, DiscountType } from "@/lib/discounts/types"
import { cn } from "@/lib/utils"

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

type AdminUser = {
  id: string
  email: string
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
  company_name?: string | null
  phone?: string | null
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
    serviceIds: (initialData?.serviceIds as string[]) || [],
    scopeType: (initialData?.scopeType as DiscountScopeType) || "all_models",
    brandId: initialData?.brandId || "",
    seriesId: initialData?.seriesId || "",
    modelId: initialData?.modelId || "",
    isActive: initialData?.isActive ?? true,
    startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().split("T")[0] : "",
    expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split("T")[0] : "",
    maxUses: initialData?.maxUses || "",
    maxUsesPerUser: initialData?.maxUsesPerUser || "",
    userId: initialData?.userId || "global",
  })

  const [brands, setBrands] = useState<Brand[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userPickerOpen, setUserPickerOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBrands()
    fetchServices()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchUsers(userSearchQuery)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [userSearchQuery])

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

  async function fetchUsers(query = "") {
    try {
      const params = new URLSearchParams({ limit: "20" })
      if (query.trim()) params.set("query", query.trim())

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  function handleScopeTypeChange(value: DiscountScopeType) {
    setFormData({
      ...formData,
      scopeType: value,
      brandId: "",
      seriesId: "",
      modelId: "",
    })
  }

  function toggleService(serviceId: string) {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }))
  }

  function getUserDisplayName(user: AdminUser) {
    return (
      user.full_name ||
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.company_name ||
      user.email ||
      user.id
    )
  }

  function getUserSearchText(user: AdminUser) {
    return [user.id, user.email, user.phone, user.full_name, user.first_name, user.last_name, user.company_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  }

  const selectedUser = users.find((user) => user.id === formData.userId)
  const selectedUserLabel = selectedUser
    ? `${getUserDisplayName(selectedUser)} - ${selectedUser.email}`
    : formData.userId === "global"
      ? "Глобальна для всіх користувачів"
      : `Персональна: ${formData.userId}`
  const normalizedUserSearchQuery = userSearchQuery.trim().toLowerCase()
  const filteredUsers = normalizedUserSearchQuery
    ? users.filter((user) => getUserSearchText(user).includes(normalizedUserSearchQuery))
    : users

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.serviceIds.length === 0) {
      alert("Будь ласка, оберіть хоча б одну послугу")
      return
    }

    if (formData.scopeType === "brand" && !formData.brandId) {
      alert("Будь ласка, оберіть бренд")
      return
    }

    if (formData.scopeType === "series" && !formData.seriesId) {
      alert("Будь ласка, оберіть серію")
      return
    }

    if (formData.scopeType === "model" && !formData.modelId) {
      alert("Будь ласка, оберіть модель")
      return
    }

    const discountValue = Number.parseFloat(formData.discountValue as string)
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      alert("Будь ласка, вкажіть коректний розмір знижки")
      return
    }

    if (formData.discountType === "percentage" && discountValue > 100) {
      alert("Відсоткова знижка не може бути більшою за 100%")
      return
    }

    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        discountValue,
        maxUses: formData.maxUses ? Number.parseInt(formData.maxUses as string) : null,
        maxUsesPerUser: formData.maxUsesPerUser ? Number.parseInt(formData.maxUsesPerUser as string) : null,
        startsAt: formData.startsAt || null,
        expiresAt: formData.expiresAt || null,
        userId: formData.userId === "global" ? null : formData.userId,
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

        <div className="col-span-2 border rounded-lg p-4 bg-blue-50">
          <Label className="text-base font-semibold mb-3 block">Оберіть послуги (одну або декілька) *</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {services.map((service) => (
              <div key={service.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={formData.serviceIds.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <Label htmlFor={`service-${service.id}`} className="text-sm font-normal cursor-pointer">
                  {service.name}
                </Label>
              </div>
            ))}
          </div>
          {formData.serviceIds.length > 0 && (
            <p className="text-xs text-blue-700 mt-2">Обрано послуг: {formData.serviceIds.length}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="scopeType">Застосування знижки *</Label>
          <Select value={formData.scopeType} onValueChange={handleScopeTypeChange}>
            <SelectTrigger id="scopeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_models">Всі моделі (для обраних послуг)</SelectItem>
              <SelectItem value="brand">Всі моделі бренду</SelectItem>
              <SelectItem value="series">Всі моделі серії</SelectItem>
              <SelectItem value="model">Конкретна модель</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Знижка буде застосована до обраних послуг на вказаному рівні
          </p>
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
                <SelectValue placeholder={formData.scopeType === "series" ? "Оберіть серію" : "Оберіть серію (опційно)"} />
              </SelectTrigger>
              <SelectContent>
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

        <div className="col-span-2">
          <Label htmlFor="userId">Тип знижки</Label>
          <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                id="userId"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={userPickerOpen}
                className="h-auto min-h-10 w-full justify-between gap-2 px-3 text-left font-normal"
              >
                <span className="min-w-0 truncate">
                  {selectedUserLabel}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  icon={Search}
                  value={userSearchQuery}
                  onValueChange={setUserSearchQuery}
                  placeholder="Пошук за телефоном, email, ім'ям або ID"
                />
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="global"
                      onSelect={() => {
                        setFormData({ ...formData, userId: "global" })
                        setUserSearchQuery("")
                        setUserPickerOpen(false)
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", formData.userId === "global" ? "opacity-100" : "opacity-0")}
                      />
                      <span>Глобальна для всіх користувачів</span>
                    </CommandItem>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={getUserSearchText(user)}
                        onSelect={() => {
                          setFormData({ ...formData, userId: user.id })
                          setUserSearchQuery("")
                          setUserPickerOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", formData.userId === user.id ? "opacity-100" : "opacity-0")}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{getUserDisplayName(user)}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {[user.email, user.phone, user.id].filter(Boolean).join(" | ")}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandEmpty>Користувача не знайдено</CommandEmpty>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground mt-1">
            Для персональної знижки оберіть конкретного користувача. Глобальна знижка працює для всіх.
          </p>
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
