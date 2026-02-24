"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Calendar, Clock, X, Clock3, Shield } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"

interface BookingConfirmationProps {
  locale: string
  brand?: { name: string; slug: string }
  model?: { name: string; slug: string; id?: string }
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
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
  })

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [localizedService, setLocalizedService] = useState(service)

  // Re-fetch service data when locale changes to get proper translations
  useEffect(() => {
    console.log("[v0] Booking confirmation: locale changed to", locale)
    if (service?.slug && model?.id) {
      // Перезавантажуємо дані при зміні locale
      const refetchServiceData = async () => {
        try {
          console.log("[v0] Refetching service data for locale:", locale, "model_id:", model.id, "service_slug:", service.slug)
          const response = await fetch(`/api/admin/model-services?model_id=${model.id}&locale=${locale}`)
          if (!response.ok) return
          
          const data = await response.json()
          const servicesArray = Array.isArray(data) ? data : data?.data || []
          
          // Шукаємо послугу за slug
          const foundService = servicesArray.find((ms: any) => (ms.services?.slug || "") === service.slug)
          
          if (foundService) {
            console.log("[v0] Found service with updated data:", foundService)
            setLocalizedService({
              ...service,
              name: foundService.services?.name || foundService.name || service.name,
              duration_hours: foundService.duration_hours,
              warranty_months: foundService.warranty_months,
              warranty_period: foundService.warranty_period,
            })
          }
        } catch (error) {
          console.error("[v0] Error refetching service data:", error)
        }
      }
      
      refetchServiceData()
    }
  }, [locale, service?.slug, model?.id, service])

  // Guard clause for missing data
  if (!brand || !model || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: Missing booking data</p>
        </div>
      </div>
    )
  }

  // Generate time slots
  const timeSlots: TimeSlot[] = Array.from({ length: 11 }, (_, i) => ({
    hour: 9 + i,
    available: true,
  }))

  // Generate available dates
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Skip Sundays
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
      alert("Please fill all required fields")
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
          service: localizedService?.name,
          brand: brand.name,
          model: model.name,
          price: localizedService?.price ? formatCurrency(localizedService.price) : null,
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit booking")
      }

      const result = await response.json()

      if (result.success) {
        alert(`Thank you! Your booking has been submitted. We will contact you shortly at ${formData.phone}`)
        onBack()
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      alert("An error occurred while submitting your booking. Please try again.")
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

  const phonePlaceholder = phoneCountryCode[locale] || "+1"

  // Format warranty text
  const warrantyText = localizedService?.warranty_months ? `${localizedService.warranty_months} ${t("months")}` : localizedService?.warranty_period || ""
  const durationText = localizedService?.duration_hours ? `${localizedService.duration_hours}h` : ""

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Home Button */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 mb-6 sm:mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToHome") || "Back to Home"}
        </Link>

        {/* Page Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t("bookService") || "Book a Service"}</h1>

        {/* Service Summary Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="text-center space-y-3">
            {/* Service Name */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{localizedService?.name}</h2>

            {/* Device Info */}
            <p className="text-gray-600">
              {brand.name} {model.name}
            </p>

            {/* Price, Duration, Warranty */}
            <div className="flex flex-wrap justify-center items-center gap-4 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {localizedService?.price ? formatCurrency(localizedService.price) : "—"}
                </p>
              </div>

              {durationText && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock3 className="h-5 w-5" />
                  <span>{durationText}</span>
                </div>
              )}

              {warrantyText && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-5 w-5" />
                  <span>{warrantyText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              {t("personalInfo") || "Personal Information"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("firstName")} <span className="text-red-500">*</span>
                </label>
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t("enterFirstName")}
                autoComplete="given-name"
                required
                disabled={submitting}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 focus:border-gray-900 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("lastName")} <span className="text-red-500">*</span>
                </label>
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t("enterLastName")}
                autoComplete="family-name"
                required
                disabled={submitting}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 focus:border-gray-900 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("phone")} <span className="text-red-500">*</span>
                </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={`${phoneCountryCode[locale] || "+380"} ...`}
                autoComplete="tel"
                required
                disabled={submitting}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 focus:border-gray-900 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("email")} <span className="text-red-500">*</span>
                </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t("email")}
                autoComplete="email"
                required
                disabled={submitting}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-20 focus:border-gray-900 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Calendar className="w-5 h-5" />
              {t("dateTime") || "Date & Time"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("selectDate") || "Date"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-left text-sm flex items-center justify-between hover:border-gray-400 transition-colors"
                  >
                    <span>{formattedDate || "Select date"}</span>
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </button>

                  {showDatePicker && (
                    <div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded-lg p-3 z-50 shadow-lg w-full sm:w-72">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t("selectDate")}</h3>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
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
                              className={`p-2 text-xs font-medium rounded transition-all ${
                                isSelected
                                  ? "bg-gray-900 text-white"
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

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("selectTime") || "Time"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(!showTimePicker)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-left text-sm flex items-center justify-between hover:border-gray-400 transition-colors"
                  >
                    <span>{selectedTime || "Select time"}</span>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </button>

                  {showTimePicker && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-lg p-3 z-50 shadow-lg w-full sm:w-72">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">{t("selectTime")}</h3>
                        <button
                          type="button"
                          onClick={() => setShowTimePicker(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.hour}
                            type="button"
                            onClick={() => {
                              setSelectedTime(`${slot.hour.toString().padStart(2, "0")}:00`)
                              setShowTimePicker(false)
                            }}
                            className={`p-2 text-xs font-medium rounded transition-all ${
                              selectedTime === `${slot.hour.toString().padStart(2, "0")}:00`
                                ? "bg-gray-900 text-white"
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
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("additionalInfo") || "Additional Notes"}
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={3}
              disabled={submitting}
              placeholder={t("additionalNotesPlaceholder") || "Any additional information..."}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone || !selectedDate || !selectedTime}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-semibold rounded text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                {t("submitting") || "Submitting..."}
              </>
            ) : (
              t("submitBooking") || "Confirm Booking"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
