"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Calendar, Clock, X } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface BookingConfirmationProps {
  locale: string
  brand?: { name: string; slug: string }
  model?: { name: string; slug: string }
  service?: {
    name: string
    slug: string
    price: number | null
    warranty_months?: number
    duration_hours?: number
    warranty_period?: string
  }
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
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

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
        alert(
          t("bookingSuccess") ||
          `Thank you! Your booking has been submitted. We will contact you shortly at ${formData.phone}`
        )
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
        day: "numeric",
        month: "short",
      })
    : ""

  // Format warranty and duration for display
  const warrantyText = service.warranty_months
    ? `${service.warranty_months} ${service.warranty_period || "місяців"}`
    : "—"
  const durationText = service.duration_hours ? `${service.duration_hours} год.` : "—"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-10 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t("back")}
        </button>

        <div className="space-y-8">
          {/* Header */}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{t("confirmBooking")}</h1>
            <p className="text-lg text-gray-600">{t("enterDetails")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Service Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8 space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Бренд</p>
                  <p className="text-xl font-bold text-gray-900">{brand.name}</p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Модель</p>
                  <p className="text-lg font-semibold text-gray-900">{model.name}</p>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Послуга</p>
                    <p className="text-lg font-semibold text-gray-900">{service.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Час роботи</p>
                      <p className="text-sm font-semibold text-gray-700">{durationText}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Гарантія</p>
                      <p className="text-sm font-semibold text-gray-700">{warrantyText}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Ціна</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {service.price ? formatCurrency(service.price) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("firstName")} *</label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("lastName")} *</label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("email")} *</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("phone")} *</label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="+38 (0XX) XXX-XX-XX"
                    />
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Picker Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("selectDate")} *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className={formattedDate ? "text-gray-900 font-medium" : "text-gray-500"}>
                          {formattedDate || "Виберіть дату"}
                        </span>
                      </button>

                      {/* Date Picker Modal */}
                      {showDatePicker && (
                        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg p-4 z-50 shadow-lg w-full min-w-72">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">{t("selectDate")}</h3>
                            <button
                              type="button"
                              onClick={() => setShowDatePicker(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                            {availableDates.map((date) => {
                              const dateStr = date.toISOString().split("T")[0]
                              const isSelected = selectedDate === dateStr

                              return (
                                <button
                                  key={dateStr}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(dateStr)
                                    setShowDatePicker(false)
                                  }}
                                  className={`p-3 text-sm rounded-lg font-semibold transition-all ${
                                    isSelected
                                      ? "bg-gray-900 text-white shadow-md"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {date.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Picker Field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">{t("selectTime")} *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTimePicker(!showTimePicker)}
                        className="w-full flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors"
                      >
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className={selectedTime ? "text-gray-900 font-medium" : "text-gray-500"}>
                          {selectedTime || "Виберіть час"}
                        </span>
                      </button>

                      {/* Time Picker Modal */}
                      {showTimePicker && (
                        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg p-4 z-50 shadow-lg w-full min-w-72">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">{t("selectTime")}</h3>
                            <button
                              type="button"
                              onClick={() => setShowTimePicker(false)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((slot) => (
                              <button
                                key={slot.hour}
                                type="button"
                                onClick={() => {
                                  setSelectedTime(`${slot.hour.toString().padStart(2, "0")}:00`)
                                  setShowTimePicker(false)
                                }}
                                className={`p-3 text-sm rounded-lg font-semibold transition-all ${
                                  selectedTime === `${slot.hour.toString().padStart(2, "0")}:00`
                                    ? "bg-gray-900 text-white shadow-md"
                                    : slot.available
                                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      : "bg-gray-50 text-gray-300 cursor-not-allowed"
                                }`}
                              >
                                {slot.hour}:00
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">{t("additionalInfo")}</label>
                  <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleInputChange}
                    rows={4}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Додайте деякі зауваження або спеціальні вимоги..."
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !formData.firstName ||
                    !formData.lastName ||
                    !formData.email ||
                    !formData.phone ||
                    !selectedDate ||
                    !selectedTime
                  }
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 text-base font-semibold rounded-lg transition-colors"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("submitBooking")
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
