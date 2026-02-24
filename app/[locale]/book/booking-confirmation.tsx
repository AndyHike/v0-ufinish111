"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Calendar, Clock, X, ChevronDown } from "lucide-react"
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

const phoneCountryCode: { [key: string]: string } = {
  uk: "+380",
  en: "+44",
  cs: "+420",
}

export default function BookingConfirmation({
  locale,
  brand,
  model,
  service,
  onBack,
}: BookingConfirmationProps) {
  const t = useTranslations("StandaloneBooking")
  const commonT = useTranslations("common")
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [expandSummary, setExpandSummary] = useState(false)

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

  // Generate time slots from 9 to 19
  const timeSlots: TimeSlot[] = Array.from({ length: 11 }, (_, i) => ({
    hour: 9 + i,
    available: true,
  }))

  // Generate available dates (next 30 days, except Sundays)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Skip Sundays (0)
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

  const countryCode = phoneCountryCode[locale] || "+44"

  return (
    <div className="min-h-screen bg-white py-4 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 sm:mb-10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Service Summary - Compact and Collapsible on Mobile */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              {/* Mobile: Collapsible Summary */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={() => setExpandSummary(!expandSummary)}
                  className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 flex items-center justify-between transition-colors"
                >
                  <h3 className="font-medium text-gray-900 text-sm">{t("summary")}</h3>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-600 transition-transform ${expandSummary ? "rotate-180" : ""}`}
                  />
                </button>

                {expandSummary && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("brand")}</p>
                      <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("model")}</p>
                      <p className="text-sm font-medium text-gray-900">{model.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("service")}</p>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-300">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("price")}</p>
                      <p className="text-lg font-bold text-gray-900">{service.price ? formatCurrency(service.price) : "—"}</p>
                    </div>
                    {(service.duration_hours || service.warranty_months) && (
                      <div className="pt-2 border-t border-gray-300 space-y-2">
                        {service.duration_hours && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Час роботи</p>
                            <p className="text-sm text-gray-900">~{service.duration_hours}h</p>
                          </div>
                        )}
                        {service.warranty_months && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Гарантія</p>
                            <p className="text-sm text-gray-900">{service.warranty_months} місяців</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop: Always Visible Summary */}
              <div className="hidden lg:block bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 text-sm mb-3">{t("summary")}</h3>
                
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("brand")}</p>
                  <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("model")}</p>
                  <p className="text-sm font-medium text-gray-900">{model.name}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("service")}</p>
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                </div>
                
                <div className="pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">{t("price")}</p>
                  <p className="text-lg font-bold text-gray-900">{service.price ? formatCurrency(service.price) : "—"}</p>
                </div>

                {(service.duration_hours || service.warranty_months) && (
                  <div className="pt-3 border-t border-gray-300 space-y-2">
                    {service.duration_hours && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Час роботи</p>
                        <p className="text-sm text-gray-900">~{service.duration_hours}h</p>
                      </div>
                    )}
                    {service.warranty_months && (
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Гарантія</p>
                        <p className="text-sm text-gray-900">{service.warranty_months} місяців</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-gray-900 mb-2">{t("confirmBooking")}</h1>
              <p className="text-gray-600 text-sm sm:text-base">{t("enterDetails")}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6 sm:space-y-8">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("firstName")} *
                  </label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("lastName")} *
                  </label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("email")} *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("phone")} *
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    placeholder={countryCode}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Date Picker Field */}
                <div>
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("selectDate")} *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full flex items-center gap-2 border border-gray-300 bg-white rounded px-3 py-2 text-sm text-gray-900 hover:border-gray-500 transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span>{formattedDate || "Select date"}</span>
                    </button>

                    {/* Date Picker Modal */}
                    {showDatePicker && (
                      <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto bg-white border border-gray-300 rounded-lg p-3 z-50 shadow-lg w-full sm:w-80">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-medium text-gray-900">{t("selectDate")}</h3>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
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
                                className={`p-2 text-xs rounded font-medium transition-all ${
                                  isSelected
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                    {t("selectTime")} *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="w-full flex items-center gap-2 border border-gray-300 bg-white rounded px-3 py-2 text-sm text-gray-900 hover:border-gray-500 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span>{selectedTime || "Select time"}</span>
                    </button>

                    {/* Time Picker Modal */}
                    {showTimePicker && (
                      <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg p-3 z-50 shadow-lg w-full sm:w-80">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-medium text-gray-900">{t("selectTime")}</h3>
                          <button
                            onClick={() => setShowTimePicker(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
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
                              className={`p-2 text-xs rounded font-medium transition-all ${
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
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Field */}
              <div>
                <label className="block text-xs text-gray-600 uppercase tracking-wide mb-2 sm:mb-3">
                  {t("additionalInfo")}
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  rows={3}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 bg-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
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
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 sm:py-3 text-sm font-medium rounded"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
