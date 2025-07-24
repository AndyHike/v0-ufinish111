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
import { Calendar, User, MessageSquare, ArrowLeft, Star, Loader2 } from "lucide-react"
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

  // Завантажуємо дані за slug
  useEffect(() => {
    if (!serviceSlug) {
      setError("Service not specified")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          service_slug: serviceSlug,
          locale: locale,
        })

        if (modelSlug) {
          params.set("model_slug", modelSlug)
        }

        const response = await fetch(`/api/book-service/data?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch booking data")
        }

        const data = await response.json()
        setBookingData(data)
      } catch (err) {
        console.error("Error fetching booking data:", err)
        setError("Failed to load booking information")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [serviceSlug, modelSlug, locale])

  // Генеруємо доступні дати (наступні 14 днів, тільки робочі дні)
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 20; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      // Пропускаємо вихідні (субота = 6, неділя = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date)
      }

      if (dates.length >= 14) break
    }

    return dates
  }

  // Генеруємо доступний час (9:00 - 19:00)
  const getAvailableTimes = () => {
    const times = []
    for (let hour = 9; hour <= 18; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`)
      times.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return times
  }

  // Валідація телефону - тільки цифри, пробіли, дефіси та плюс
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
    // Для телефону дозволяємо тільки цифри, пробіли, дефіси, плюс та дужки
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
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">{commonT("loading")}</span>
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
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-4">{error || "Service not found"}</p>
              <Button asChild>
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
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link href={`/${locale}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            {commonT("backToHome")}
          </Link>
        </nav>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{t("title")}</CardTitle>
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 mt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{t("selectedService")}</p>
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">{bookingData.service.name}</h3>
              {bookingData.model && (
                <div className="bg-white px-4 py-2 rounded-full inline-block border border-blue-300">
                  <p className="text-lg font-semibold text-gray-800">
                    {bookingData.model.brands.name} {bookingData.model.name}
                  </p>
                </div>
              )}
              <p className="text-2xl font-bold text-green-600 mt-3 bg-green-50 px-4 py-2 rounded-lg inline-block border border-green-200">
                {formatPrice()}
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Особисті дані */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("personalInfo")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("firstName")} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={errors.firstName ? "border-red-500" : ""}
                      placeholder={t("firstNamePlaceholder")}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="lastName">{t("lastName")} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={errors.lastName ? "border-red-500" : ""}
                      placeholder={t("lastNamePlaceholder")}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t("phone")} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className={errors.phone ? "border-red-500" : ""}
                      placeholder={t("phonePlaceholder")}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">{t("email")} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                      placeholder={t("emailPlaceholder")}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Дата і час */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t("dateTime")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">{t("date")} *</Label>
                    <select
                      id="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${errors.date ? "border-red-500" : "border-gray-300"}`}
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
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                  </div>

                  <div>
                    <Label htmlFor="time">{t("time")} *</Label>
                    <select
                      id="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md ${errors.time ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">{t("selectTime")}</option>
                      {getAvailableTimes().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                  </div>
                </div>
              </div>

              {/* Додаткова інформація */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t("additionalInfo")}
                </h3>

                <div>
                  <Label htmlFor="comment">{t("comment")}</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => handleInputChange("comment", e.target.value)}
                    placeholder={t("commentPlaceholder")}
                    rows={4}
                  />
                </div>
              </div>

              {/* Кнопка відправки */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  size="lg"
                >
                  {isSubmitting ? t("submitting") : t("submitBooking")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
