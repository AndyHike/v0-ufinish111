"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, MessageSquare, ArrowLeft, Loader2, Clock, Shield } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/format-currency"

interface Props {
  locale: string
  serviceSlug?: string
  modelSlug?: string
}

interface BookingData {
  service: {
    id: string
    slug: string
    name: string
    description: string
    image_url: string | null
    warranty_months: number | null
    warranty_period: string
    duration_hours: number | null
  }
  model: {
    id: string
    name: string
    slug: string
    image_url: string | null
    brands: {
      id: string
      name: string
      slug: string
      logo_url: string | null
    }
  } | null
  price: number | { min: number; max: number } | null
  discountedPrice?: number | null
  hasDiscount?: boolean
}

export default function BookServiceClient({ locale, serviceSlug, modelSlug }: Props) {
  const t = useTranslations("BookService")
  const commonT = useTranslations("Common")
  const router = useRouter()

  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    comment: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!serviceSlug) {
      setError("Service not specified")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          locale,
        })

        if (modelSlug) {
          params.set("model", modelSlug)
        }

        const response = await fetch(`/api/services/${serviceSlug}?${params.toString()}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const serviceData = await response.json()

        const transformedData: BookingData = {
          service: {
            id: serviceData.id,
            slug: serviceData.slug,
            name: serviceData.translation.name,
            description: serviceData.translation.description,
            image_url: serviceData.image_url,
            warranty_months: serviceData.warranty_months,
            warranty_period: serviceData.warranty_period,
            duration_hours: serviceData.duration_hours,
          },
          model: serviceData.sourceModel,
          price:
            serviceData.modelServicePrice !== null
              ? serviceData.modelServicePrice
              : serviceData.minPrice !== null && serviceData.maxPrice !== null
                ? serviceData.minPrice === serviceData.maxPrice
                  ? serviceData.minPrice
                  : { min: serviceData.minPrice, max: serviceData.maxPrice }
                : null,
          discountedPrice: serviceData.discountedPrice,
          hasDiscount: serviceData.hasDiscount,
        }

        setBookingData(transformedData)
      } catch (err) {
        console.error("Error fetching booking data:", err)
        setError("Failed to load booking information")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [serviceSlug, modelSlug, locale])

  const getAvailableDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 20; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date)
      }

      if (dates.length >= 14) break
    }

    return dates
  }

  const getAvailableTimes = () => {
    const times = []
    for (let hour = 9; hour <= 18; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`)
      times.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return times
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-+()]+$/
    return phoneRegex.test(phone) && phone.replace(/[\s\-+()]/g, "").length >= 9
  }

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
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("phoneInvalid")
    }

    if (!formData.email.trim()) {
      newErrors.email = t("emailRequired")
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("emailInvalid")
    }

    if (!formData.date) {
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

    if (!validateForm() || !bookingData) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          service: bookingData.service.name,
          brand: bookingData.model?.brands?.name,
          model: bookingData.model?.name,
          price: formatPrice(),
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
      alert(t("submitError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "phone") {
      const cleanValue = value.replace(/[^\d\s\-+()]/g, "")
      setFormData((prev) => ({ ...prev, [field]: cleanValue }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const formatPrice = () => {
    if (!bookingData?.price) return t("priceOnRequest")

    if (bookingData.hasDiscount && bookingData.discountedPrice) {
      return formatCurrency(bookingData.discountedPrice)
    }

    if (typeof bookingData.price === "number") {
      return formatCurrency(bookingData.price)
    }

    if (typeof bookingData.price === "object" && "min" in bookingData.price) {
      return `${formatCurrency(bookingData.price.min)} - ${formatCurrency(bookingData.price.max)}`
    }

    return t("priceOnRequest")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="shadow-sm">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
              <span className="ml-3 text-gray-600">{commonT("loading")}</span>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="shadow-sm">
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error || "Service not found"}</p>
              <Button asChild variant="outline">
                <Link href={`/${locale}`}>{commonT("backToHome")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
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
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">{t("title")}</CardTitle>

            <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{bookingData.service.name}</h3>

                {bookingData.model && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border text-gray-700">
                      {bookingData.model.brands.name} {bookingData.model.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {bookingData.hasDiscount && bookingData.discountedPrice && typeof bookingData.price === "number" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through text-sm">{formatCurrency(bookingData.price)}</span>
                        <span className="font-semibold text-xl text-green-600">
                          {formatCurrency(bookingData.discountedPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-lg text-gray-900">{formatPrice()}</span>
                    )}
                  </div>

                  {bookingData.service.duration_hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{bookingData.service.duration_hours}h</span>
                    </div>
                  )}

                  {bookingData.service.warranty_months && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>
                        {bookingData.service.warranty_months} {t("months")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <User className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">{t("personalInfo")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      {t("firstName")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`${errors.firstName ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-colors`}
                      placeholder={t("firstNamePlaceholder")}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      {t("lastName")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`${errors.lastName ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-colors`}
                      placeholder={t("lastNamePlaceholder")}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      {t("phone")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={`${errors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-colors`}
                      placeholder={t("phonePlaceholder")}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      {t("email")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"} transition-colors`}
                      placeholder={t("emailPlaceholder")}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">{t("dateTime")}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                      {t("date")} <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                        errors.date
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    >
                      <option value="">{t("selectDate")}</option>
                      {getAvailableDates().map((date) => (
                        <option key={date.toISOString()} value={date.toISOString().split("T")[0]}>
                          {date.toLocaleDateString(locale, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </option>
                      ))}
                    </select>
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                      {t("time")} <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                        errors.time
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                    >
                      <option value="">{t("selectTime")}</option>
                      {getAvailableTimes().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">{t("additionalInfo")}</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-sm font-medium text-gray-700">
                    {t("comment")}
                  </Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => handleInputChange("comment", e.target.value)}
                    placeholder={t("commentPlaceholder")}
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium transition-colors disabled:opacity-50"
                  size="lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("submitting")}
                    </div>
                  ) : (
                    t("submitBooking")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
