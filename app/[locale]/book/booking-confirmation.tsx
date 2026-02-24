"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const timeSlots: TimeSlot[] = Array.from({ length: 11 }, (_, i) => ({
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
      <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("back")}
      </Button>

      {/* Minimalist Summary */}
      <div className="space-y-3">
        <h2 className="text-2xl font-light text-gray-900">{t("confirmBooking")}</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>{brand.name}</span>
            <span className="text-gray-400">•</span>
            <span>{model.name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-900">{service.name}</span>
            {service.price && (
              <span className="font-semibold text-gray-900">{formatCurrency(service.price)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Minimalist Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder={t("firstName")}
              required
              disabled={submitting}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:ring-0"
            />
          </div>
          <div className="space-y-1">
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder={t("lastName")}
              required
              disabled={submitting}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:ring-0"
            />
          </div>
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("email")}
              required
              disabled={submitting}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:ring-0"
            />
          </div>
          <div className="space-y-1">
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={t("phone")}
              required
              disabled={submitting}
              className="border-0 border-b border-gray-300 rounded-none bg-transparent px-0 py-2 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:ring-0"
            />
          </div>
        </div>

        {/* Date Selection - Minimalist Toggles */}
        <div className="space-y-3 pt-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("selectDate")}</div>
          <div className="flex overflow-x-auto gap-1 pb-2">
            {availableDates.map((date) => {
              const dateStr = date.toISOString().split("T")[0]
              const isSelected = selectedDate === dateStr
              
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  disabled={submitting}
                  className={`flex-shrink-0 px-3 py-2 text-xs transition-all ${
                    isSelected
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <div className="font-medium">{date.getDate()}</div>
                  <div className="text-xs">
                    {date.toLocaleDateString(locale, { weekday: "short" })[0]}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Time Selection - Minimalist Toggles */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("selectTime")}</div>
          <div className="grid grid-cols-6 gap-1">
            {timeSlots.map((slot) => (
              <button
                key={slot.hour}
                type="button"
                onClick={() => setSelectedTime(`${slot.hour.toString().padStart(2, "0")}:00`)}
                disabled={!slot.available || submitting}
                className={`px-2 py-2 text-xs transition-all ${
                  selectedTime === `${slot.hour.toString().padStart(2, "0")}:00`
                    ? "bg-gray-900 text-white"
                    : slot.available
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-300 cursor-not-allowed"
                }`}
              >
                {slot.hour}:00
              </button>
            ))}
          </div>
        </div>

        {/* Comment Field */}
        <div className="space-y-2 pt-2">
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder={t("additionalInfo")}
            rows={3}
            disabled={submitting}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={submitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !selectedDate || !selectedTime}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-sm font-medium rounded-none"
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
    </div>
  )
}
