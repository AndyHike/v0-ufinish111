"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Save, Upload, X } from "lucide-react"

type ServiceData = {
  id: string
  warranty_months: number
  duration_hours: number
  image_url: string | null
  slug: string | null
  services_translations: Array<{
    locale: string
    name: string
    description: string
    detailed_description: string | null
    what_included: string | null
    benefits: string | null
  }>
}

type ServiceEditorProps = {
  serviceId: string
  onClose: () => void
}

const LOCALES = [
  { code: "uk", name: "Українська" },
  { code: "en", name: "English" },
  { code: "cs", name: "Čeština" },
]

export function ServiceEditor({ serviceId, onClose }: ServiceEditorProps) {
  const t = useTranslations("Admin")
  const { toast } = useToast()

  const [service, setService] = useState<ServiceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("uk")

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`)
      if (!response.ok) throw new Error("Failed to fetch service")

      const data = await response.json()
      setService(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load service data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!service) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          warranty_months: service.warranty_months,
          duration_hours: service.duration_hours,
          image_url: service.image_url,
          slug: service.slug,
          translations: service.services_translations,
        }),
      })

      if (!response.ok) throw new Error("Failed to save service")

      toast({
        title: "Success",
        description: "Service updated successfully",
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateTranslation = (locale: string, field: string, value: string) => {
    if (!service) return

    setService({
      ...service,
      services_translations: service.services_translations.map((translation) =>
        translation.locale === locale ? { ...translation, [field]: value } : translation,
      ),
    })
  }

  const getTranslation = (locale: string) => {
    return (
      service?.services_translations.find((t) => t.locale === locale) || {
        locale,
        name: "",
        description: "",
        detailed_description: "",
        what_included: "",
        benefits: "",
      }
    )
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!service) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Service</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основні налаштування */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="warranty">Warranty (months)</Label>
              <Input
                id="warranty"
                type="number"
                value={service.warranty_months}
                onChange={(e) =>
                  setService({
                    ...service,
                    warranty_months: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                step="0.1"
                value={service.duration_hours}
                onChange={(e) =>
                  setService({
                    ...service,
                    duration_hours: Number.parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={service.slug || ""}
                onChange={(e) =>
                  setService({
                    ...service,
                    slug: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Зображення */}
          <div>
            <Label htmlFor="image">Service Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="image"
                value={service.image_url || ""}
                onChange={(e) =>
                  setService({
                    ...service,
                    image_url: e.target.value,
                  })
                }
                placeholder="https://example.com/image.jpg"
              />
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {service.image_url && (
              <div className="mt-2">
                <img
                  src={service.image_url || "/placeholder.svg"}
                  alt="Service preview"
                  className="h-20 w-20 object-contain bg-white rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Переклади */}
          <div>
            <Label className="text-base font-semibold">Translations</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                {LOCALES.map((locale) => (
                  <TabsTrigger key={locale.code} value={locale.code}>
                    {locale.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {LOCALES.map((locale) => {
                const translation = getTranslation(locale.code)
                return (
                  <TabsContent key={locale.code} value={locale.code} className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${locale.code}`}>Service Name</Label>
                      <Input
                        id={`name-${locale.code}`}
                        value={translation.name}
                        onChange={(e) => updateTranslation(locale.code, "name", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`description-${locale.code}`}>Short Description</Label>
                      <Textarea
                        id={`description-${locale.code}`}
                        value={translation.description}
                        onChange={(e) => updateTranslation(locale.code, "description", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`detailed-${locale.code}`}>Detailed Description</Label>
                      <Textarea
                        id={`detailed-${locale.code}`}
                        value={translation.detailed_description || ""}
                        onChange={(e) => updateTranslation(locale.code, "detailed_description", e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`included-${locale.code}`}>What's Included (one per line)</Label>
                      <Textarea
                        id={`included-${locale.code}`}
                        value={translation.what_included || ""}
                        onChange={(e) => updateTranslation(locale.code, "what_included", e.target.value)}
                        rows={4}
                        placeholder="Діагностика пристрою&#10;Виконання ремонтних робіт&#10;Тестування після ремонту"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`benefits-${locale.code}`}>Benefits (one per line)</Label>
                      <Textarea
                        id={`benefits-${locale.code}`}
                        value={translation.benefits || ""}
                        onChange={(e) => updateTranslation(locale.code, "benefits", e.target.value)}
                        rows={4}
                        placeholder="Швидке виконання&#10;Оригінальні запчастини&#10;Досвідчені майстри"
                      />
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>

          {/* Кнопки дій */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
