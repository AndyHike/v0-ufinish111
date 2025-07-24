"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Props {
  locale: string
  service?: string
  brand?: string
  model?: string
  price?: string
}

export default function BookServiceClient({ locale, service, brand, model, price }: Props) {
  const t = useTranslations("BookService")
  const commonT = useTranslations("Common")
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    comment: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired")
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("phoneRequired")
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

    if (!validateForm()) {
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
          service,
          brand,
          model,
          price,
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
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const serviceInfo = service ? `${service}${brand && model ? ` (${brand} ${model})` : ""}` : ""

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
            {serviceInfo && (
              <div className="text-center">
                <p className="text-gray-600">{t("selectedService")}</p>
                <p className="font-semibold text-blue-600">{serviceInfo}</p>
                {price && <p className="text-lg font-bold text-gray-900">{price}</p>}
              </div>
            )}
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
                    <Label htmlFor="name">{t("name")} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                      placeholder={t("namePlaceholder")}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

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
