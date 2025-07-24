"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, MapPin, Phone, ArrowLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { uk, enUS, cs } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ServiceData {
  id: number
  name: string
  description?: string
  price?: number
  warranty_months?: number
  duration_hours?: number
  model?: {
    id: number
    name: string
    brand: {
      name: string
    }
  }
}

interface Props {
  locale: string
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

const localeMap = {
  uk: uk,
  en: enUS,
  cs: cs,
}

export default function BookServiceClient({ locale }: Props) {
  const t = useTranslations("BookService")
  const commonT = useTranslations("Common")
  const searchParams = useSearchParams()
  const router = useRouter()

  const [serviceData, setServiceData] = useState<ServiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState<Date>()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    time: "",
    comment: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const serviceSlug = searchParams.get("service")
        const modelSlug = searchParams.get("model")

        if (!serviceSlug) {
          throw new Error("Service not specified")
        }

        // Fetch service data
        const serviceResponse = await fetch(`/api/services/${serviceSlug}`)
        if (!serviceResponse.ok) {
          throw new Error("Service not found")
        }
        const service = await serviceResponse.json()

        let modelData = null
        let price = null

        if (modelSlug) {
          // Fetch model data
          const modelResponse = await fetch(`/api/models/${modelSlug}`)
          if (modelResponse.ok) {
            modelData = await modelResponse.json()

            // Find price for this service and model
            const modelService = modelData.model_services?.find((ms: any) => ms.service.slug === serviceSlug)
            price = modelService?.price
          }
        }

        setServiceData({
          id: service.id,
          name: service.name,
          description: service.description,
          price: price,
          warranty_months: service.warranty_months,
          duration_hours: service.duration_hours,
          model: modelData
            ? {
                id: modelData.id,
                name: modelData.name,
                brand: {
                  name: modelData.brand.name,
                },
              }
            : undefined,
        })
      } catch (error) {
        console.error("Error fetching booking data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServiceData()
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("firstNameRequired")
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("lastNameRequired")
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t("phoneRequired")
    }
    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired")
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("emailInvalid")
    }
    if (!date) {
      newErrors.date = t("dateRequired")
    }
    if (!formData.time) {
      newErrors.time = t("timeRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: date?.toISOString(),
          service: serviceData?.name,
          brand: serviceData?.model?.brand.name,
          model: serviceData?.model?.name,
          price: serviceData?.price ? `${serviceData.price} Kč` : t("priceOnRequest"),
          locale,
        }),
      })

      if (response.ok) {
        router.push(`/${locale}/book-service/success`)
      } else {
        throw new Error("Failed to submit booking")
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      setErrors({ submit: t("submitError") })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("serviceNotFound")}</p>
          <Button asChild variant="outline">
            <Link href={`/${locale}`}>{commonT("backToHome")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href={`/${locale}`}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {commonT("backToHome")}
          </Link>
        </nav>

        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-gray-900">{t("title")}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Service Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-3">{t("selectedService")}</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{serviceData.name}</p>
                {serviceData.model && (
                  <p className="text-gray-600 text-sm">
                    {serviceData.model.brand.name} {serviceData.model.name}
                  </p>
                )}
                {serviceData.price && <p className="text-lg font-semibold text-gray-900">{serviceData.price} Kč</p>}
                {serviceData.description && <p className="text-gray-600 text-sm">{serviceData.description}</p>}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">{t("personalInfo")}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">
                      {t("firstName")}
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t("firstNamePlaceholder")}
                      className={cn(
                        "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                        errors.firstName && "border-red-500",
                      )}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">
                      {t("lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t("lastNamePlaceholder")}
                      className={cn(
                        "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                        errors.lastName && "border-red-500",
                      )}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">
                      {t("phone")}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t("phonePlaceholder")}
                      className={cn(
                        "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                        errors.phone && "border-red-500",
                      )}
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t("emailPlaceholder")}
                      className={cn(
                        "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                        errors.email && "border-red-500",
                      )}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">{t("dateTime")}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">{t("date")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400",
                            !date && "text-gray-500",
                            errors.date && "border-red-500",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "PPP", { locale: localeMap[locale as keyof typeof localeMap] })
                          ) : (
                            <span>{t("selectDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date() || date.getDay() === 0}
                          initialFocus
                          locale={localeMap[locale as keyof typeof localeMap]}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">{t("time")}</Label>
                    <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                      <SelectTrigger
                        className={cn(
                          "border-gray-300 focus:border-gray-900 focus:ring-gray-900",
                          errors.time && "border-red-500",
                        )}
                      >
                        <SelectValue placeholder={t("selectTime")} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">{t("additionalInfo")}</h3>
                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-gray-700">
                    {t("comment")}
                  </Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder={t("commentPlaceholder")}
                    rows={4}
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 resize-none"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">Bělohorská 209/133</p>
                    <p className="text-blue-700 text-sm">169 00 Praha 6-Břevnov</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <p className="text-blue-700 font-medium">+420 775 848 259</p>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submitBooking")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
