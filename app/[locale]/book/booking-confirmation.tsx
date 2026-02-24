"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Calendar, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface BookingConfirmationProps {
  locale: string
  brand?: { name: string; slug: string }
  model?: { name: string; slug: string }
  service?: { name: string; slug: string; price: number | null }
  onBack?: () => void
}

interface TimeSlot {
  hour: number
  available: boolean
}

export default function BookingConfirmation({
  locale,
  brand,
  model,
  service,
  onBack,
}: BookingConfirmationProps) {
  const t = useTranslations("StandaloneBooking")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Guard clause for missing data
  if (!brand || !model || !service || !onBack) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-medium">Помилка: відсутні дані для підтвердження бронювання</p>
        <p className="text-gray-600 text-sm mt-2">Error: Missing booking confirmation data</p>
      </div>
    )
  }

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
  })

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")

  // Генеруємо часові слоти від 9 до 19
  const timeSlots: TimeSlot[] = Array.from({ length: 10 }, (_, i) => ({
    hour: 9 + i,
    available: true,
  }))

  // Генеруємо доступні дати (наступні 30 днів, крім неділі)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      // Пропускаємо неділю (0)
      if (date.getDay() !== 0) {
        dates.push(date)
      }
    }
    
    return dates
  }

  const availableDates = generateAvailableDates()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !selectedDate || !selectedTime) {
      alert(t("fillAllFields") || "Please fill all required fields")
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
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          comment: formData.comment,
          date: selectedDate,
          time: selectedTime,
          service: service.name,
          brand: brand.name,
          model: model.name,
          price: service.price ? formatCurrency(service.price) : null,
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit booking")
      }

      const result = await response.json()
      
      if (result.success) {
        // Показуємо повідомлення про успіх
        alert(
          t("bookingSuccess") ||
          `Thank you! Your booking has been submitted. We will contact you shortly at ${formData.phone}`
        )
        // Можемо редирект чи очистити форму
        onBack()
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      alert(t("bookingError") || "An error occurred while submitting your booking. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null
  const formattedDate = selectedDateObj
    ? selectedDateObj.toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : ""

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("back")}
      </Button>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">{t("bookingSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">{t("brand")}:</span>
            <span className="font-medium text-gray-900">{brand.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("model")}:</span>
            <span className="font-medium text-gray-900">{model.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("service")}:</span>
            <span className="font-medium text-gray-900">{service.name}</span>
          </div>
          {service.price && (
            <div className="flex justify-between pt-2 border-t border-blue-200">
              <span className="text-gray-600 font-medium">{t("price")}:</span>
              <span className="font-bold text-blue-600">{formatCurrency(service.price)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("enterDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">{t("firstName")} *</label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder={t("firstName")}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">{t("lastName")} *</label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder={t("lastName")}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">{t("email")} *</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t("email")}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">{t("phone")} *</label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("phone")}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Date and Time Selection */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  {t("selectDate")} *
                </label>
                <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                  {availableDates.map((date) => {
                    const dateStr = date.toISOString().split("T")[0]
                    const isSelected = selectedDate === dateStr
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        disabled={submitting}
                        className={`p-2 text-xs rounded border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 font-medium text-blue-600"
                            : "border-gray-200 hover:border-blue-300 text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{date.getDate()}</div>
                        <div className="text-xs opacity-70">
                          {date.toLocaleDateString(locale, { weekday: "short" })[0]}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  {t("selectTime")} *
                </label>
                <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.hour}
                      type="button"
                      onClick={() => setSelectedTime(`${slot.hour.toString().padStart(2, "0")}:00`)}
                      disabled={!slot.available || submitting}
                      className={`p-2 text-sm rounded border-2 transition-all ${
                        selectedTime === `${slot.hour.toString().padStart(2, "0")}:00`
                          ? "border-blue-500 bg-blue-50 font-medium text-blue-600"
                          : slot.available
                            ? "border-gray-200 hover:border-blue-300 text-gray-700"
                            : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {slot.hour}:00
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">{t("additionalInfo")}</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder={t("additionalInfo")}
                rows={4}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !selectedDate || !selectedTime}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submitBooking")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
