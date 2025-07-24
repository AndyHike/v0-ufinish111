"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Plus, Trash2, Save, X, HelpCircle, Upload, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { ServiceFaqManager } from "./service-faq-manager"

interface ServiceTranslation {
  locale: string
  name: string
  description: string
  detailed_description?: string
  what_included?: string
}

interface Service {
  id: string
  slug: string
  name: string
  position: number
  warranty_months: number
  duration_hours: number
  image_url?: string
  services_translations: ServiceTranslation[]
}

export function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [managingFaqsFor, setManagingFaqsFor] = useState<string | null>(null)

  const locales = [
    { code: "uk", name: "Українська" },
    { code: "en", name: "English" },
    { code: "cs", name: "Čeština" },
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/services")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched services data:", data)

      setServices(data.services || [])
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Помилка завантаження послуг")
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveService = async (serviceData: Partial<Service>) => {
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services"
      const method = editingService ? "PUT" : "POST"

      console.log("Saving service:", { url, method, serviceData })

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        toast.success(editingService ? "Послугу оновлено" : "Послугу створено")
        setIsDialogOpen(false)
        setEditingService(null)
        fetchServices()
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast.error(errorData.error || "Помилка збереження послуги")
      }
    } catch (error) {
      console.error("Error saving service:", error)
      toast.error("Помилка збереження послуги")
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цю послугу?")) return

    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Послугу видалено")
        fetchServices()
      } else {
        toast.error("Помилка видалення послуги")
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Помилка видалення послуги")
    }
  }

  const handleImageUpload = async (file: File, slug: string): Promise<string> => {
    if (!slug) {
      throw new Error("Спочатку введіть slug послуги")
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "service")
    formData.append("slug", slug)

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Помилка завантаження файлу")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Помилка завантаження зображення")
      throw error
    }
  }

  const ServiceForm = ({ service }: { service?: Service }) => {
    const [formData, setFormData] = useState({
      slug: service?.slug || "",
      position: service?.position || 0,
      warranty_months: service?.warranty_months || 6,
      duration_hours: service?.duration_hours || 2,
      image_url: service?.image_url || "",
      translations: locales.reduce(
        (acc, locale) => {
          const translation = service?.services_translations?.find((t) => t.locale === locale.code)
          acc[locale.code] = {
            name: translation?.name || "",
            description: translation?.description || "",
            detailed_description: translation?.detailed_description || "",
            what_included: translation?.what_included || "",
          }
          return acc
        },
        {} as Record<string, Omit<ServiceTranslation, "locale">>,
      ),
    })

    const [uploadingImage, setUploadingImage] = useState(false)

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Перевірка чи введений slug
      if (!formData.slug.trim()) {
        toast.error("Спочатку введіть slug послуги")
        return
      }

      // Перевірка типу файлу
      if (!file.type.startsWith("image/")) {
        toast.error("Будь ласка, оберіть файл зображення")
        return
      }

      // Перевірка розміру файлу (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Розмір файлу не повинен перевищувати 5MB")
        return
      }

      setUploadingImage(true)
      try {
        const imageUrl = await handleImageUpload(file, formData.slug)
        setFormData({ ...formData, image_url: imageUrl })
        toast.success("Зображення завантажено успішно")
      } catch (error) {
        // Помилка вже оброблена в handleImageUpload
      } finally {
        setUploadingImage(false)
      }
    }

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      console.log("Form data being submitted:", formData)
      handleSaveService(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              placeholder="repair-screen"
            />
            <p className="text-xs text-gray-500 mt-1">Slug буде використаний як назва файлу зображення</p>
          </div>
          <div>
            <Label htmlFor="position">Позиція</Label>
            <Input
              id="position"
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: Number.parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="warranty">Гарантія (місяці)</Label>
            <Input
              id="warranty"
              type="number"
              value={formData.warranty_months}
              onChange={(e) => setFormData({ ...formData, warranty_months: Number.parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="duration">Тривалість (години)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: Number.parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>Зображення послуги</Label>

          {/* Поточне зображення */}
          {formData.image_url && (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex-shrink-0">
                <img
                  src={formData.image_url || "/placeholder.svg"}
                  alt="Service preview"
                  className="w-20 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=80&width=80"
                  }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Поточне зображення</p>
                <p className="text-xs text-gray-500 break-all">{formData.image_url}</p>
                {formData.slug && (
                  <p className="text-xs text-blue-600 mt-1">
                    Файл: services/{formData.slug}.{formData.image_url.split(".").pop()}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, image_url: "" })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Завантаження нового зображення */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage || !formData.slug.trim()}
                  className="hidden"
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className={`flex items-center justify-center gap-2 h-10 px-4 py-2 bg-white border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 ${
                    !formData.slug.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      Завантаження...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Завантажити з ПК
                    </>
                  )}
                </Label>
              </div>
            </div>

            {!formData.slug.trim() && (
              <p className="text-xs text-amber-600">⚠️ Спочатку введіть slug послуги для завантаження зображення</p>
            )}

            {formData.slug.trim() && (
              <p className="text-xs text-blue-600">📁 Файл буде збережений як: services/{formData.slug}.[розширення]</p>
            )}

            <div className="text-center text-sm text-gray-500">або</div>

            <div>
              <Label htmlFor="image_url">URL зображення</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">Підтримувані формати: JPG, PNG, GIF, WebP. Максимальний розмір: 5MB</p>
        </div>

        <Tabs defaultValue="uk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {locales.map((locale) => (
              <TabsTrigger key={locale.code} value={locale.code}>
                {locale.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent key={locale.code} value={locale.code} className="space-y-4">
              <div>
                <Label htmlFor={`name-${locale.code}`}>Назва</Label>
                <Input
                  id={`name-${locale.code}`}
                  value={formData.translations[locale.code]?.name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          name: e.target.value,
                        },
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor={`description-${locale.code}`}>Короткий опис</Label>
                <Textarea
                  id={`description-${locale.code}`}
                  value={formData.translations[locale.code]?.description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          description: e.target.value,
                        },
                      },
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor={`detailed-${locale.code}`}>Детальний опис</Label>
                <Textarea
                  id={`detailed-${locale.code}`}
                  value={formData.translations[locale.code]?.detailed_description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          detailed_description: e.target.value,
                        },
                      },
                    })
                  }
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor={`included-${locale.code}`}>Що входить (кожен пункт з нового рядка)</Label>
                <Textarea
                  id={`included-${locale.code}`}
                  value={formData.translations[locale.code]?.what_included || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        [locale.code]: {
                          ...formData.translations[locale.code],
                          what_included: e.target.value,
                        },
                      },
                    })
                  }
                  rows={3}
                  placeholder="Діагностика пристрою&#10;Виконання ремонтних робіт&#10;Тестування після ремонту"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Скасувати
          </Button>
          <Button type="submit" disabled={uploadingImage}>
            <Save className="h-4 w-4 mr-2" />
            Зберегти
          </Button>
        </div>
      </form>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Завантаження послуг...</div>
        </CardContent>
      </Card>
    )
  }

  // Якщо управляємо FAQ
  if (managingFaqsFor) {
    const service = services.find((s) => s.id === managingFaqsFor)
    const serviceName =
      service?.services_translations?.find((t) => t.locale === "uk")?.name || service?.name || "Невідома послуга"

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setManagingFaqsFor(null)}>
            ← Назад до послуг
          </Button>
          <h2 className="text-2xl font-bold">FAQ для: {serviceName}</h2>
        </div>
        <ServiceFaqManager serviceId={managingFaqsFor} />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Управління послугами ({services.length})</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingService(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати послугу
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? "Редагувати послугу" : "Додати послугу"}</DialogTitle>
              </DialogHeader>
              <ServiceForm service={editingService || undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Послуги не знайдено. Додайте першу послугу.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Зображення</TableHead>
                <TableHead>Назва</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Позиція</TableHead>
                <TableHead>Гарантія</TableHead>
                <TableHead>Тривалість</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => {
                const ukTranslation = service.services_translations?.find((t) => t.locale === "uk")
                const displayName = ukTranslation?.name || service.name || "Без назви"

                return (
                  <TableRow key={service.id}>
                    <TableCell>
                      {service.image_url ? (
                        <img
                          src={service.image_url || "/placeholder.svg"}
                          alt={displayName}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=48&width=48"
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{displayName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{service.slug}</Badge>
                    </TableCell>
                    <TableCell>{service.position}</TableCell>
                    <TableCell>{service.warranty_months} міс</TableCell>
                    <TableCell>{service.duration_hours} год</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingService(service)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setManagingFaqsFor(service.id)}>
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
