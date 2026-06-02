"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Calendar, Clock, X, Clock3, Shield, BadgePercent, Ticket, HelpCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import BookingSuccess from "./booking-success"
import { getBookingDiscountPreview } from "@/app/actions/booking-discounts"
import type { BookingDiscountChoice, BookingDiscountSummary } from "@/lib/discounts/booking-discounts"

interface BookingConfirmationProps {
  locale: string
  brand?: { name: string; slug: string }
  model?: { name: string; slug: string; id?: string }
  service?: {
    id?: string
    service_id?: string
    serviceId?: string
    name: string
    slug: string
    price: number | null
    originalPrice?: number | null
    warranty_months?: number
    duration_hours?: number
    warranty_period?: string
  }
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
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [discountChoice, setDiscountChoice] = useState<BookingDiscountChoice>({ type: "none" })
  const [discountCode, setDiscountCode] = useState("")
  const [discountPreview, setDiscountPreview] = useState<BookingDiscountSummary | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [autoSelectedPersonalDiscount, setAutoSelectedPersonalDiscount] = useState(false)
  const [isRegisteredUser, setIsRegisteredUser] = useState(false)

  // Fetch user data to auto-fill form for logged-in users
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/current", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setIsRegisteredUser(true)
            setFormData(prev => ({
              ...prev,
              firstName: data.user.first_name || (data.user.name ? data.user.name.split(" ")[0] : prev.firstName),
              lastName: data.user.last_name || (data.user.name ? data.user.name.split(" ").slice(1).join(" ") : prev.lastName),
              email: data.user.email || prev.email,
              phone: data.user.phone || prev.phone,
            }))
          } else {
            setIsRegisteredUser(false)
          }
        }
      } catch (err) {
        console.error("Error fetching user for auto-fill:", err)
      }
    }
    fetchUser()
  }, [])

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

  useEffect(() => {
    const serviceId = localizedService?.serviceId || localizedService?.service_id || localizedService?.id
    const modelId = model?.id
    const originalPrice = localizedService?.originalPrice ?? localizedService?.price

    if (!serviceId || !modelId || !originalPrice) {
      setDiscountPreview(null)
      return
    }

    let cancelled = false

    const fetchDiscountPreview = async () => {
      setDiscountLoading(true)
      try {
        const preview = await getBookingDiscountPreview({
          serviceId,
          modelId,
          originalPrice,
          discountChoice,
        })

        if (cancelled) return

        setDiscountPreview(preview)

        const bestPersonalDiscount = preview.personalDiscounts[0]
        if (
          !autoSelectedPersonalDiscount &&
          discountChoice.type === "none" &&
          bestPersonalDiscount &&
          bestPersonalDiscount.discountedPrice < preview.basePrice
        ) {
          setAutoSelectedPersonalDiscount(true)
          setDiscountChoice({ type: "personal", discountId: bestPersonalDiscount.id })
        }
      } catch (error) {
        console.error("Error fetching booking discount preview:", error)
        if (!cancelled) setDiscountPreview(null)
      } finally {
        if (!cancelled) setDiscountLoading(false)
      }
    }

    fetchDiscountPreview()

    return () => {
      cancelled = true
    }
  }, [
    localizedService?.id,
    localizedService?.serviceId,
    localizedService?.service_id,
    localizedService?.originalPrice,
    localizedService?.price,
    model?.id,
    discountChoice,
    autoSelectedPersonalDiscount,
  ])

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

  // Show success screen if booking was successful
  if (bookingSuccess) {
    return <BookingSuccess locale={locale} />
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

  const handleUseBaseDiscount = () => {
    setAutoSelectedPersonalDiscount(true)
    setDiscountChoice({ type: "none" })
  }

  const handleUsePersonalDiscount = (discountId: string) => {
    setAutoSelectedPersonalDiscount(true)
    setDiscountChoice({ type: "personal", discountId })
  }

  const handleApplyDiscountCode = () => {
    setAutoSelectedPersonalDiscount(true)
    setDiscountChoice({ type: "code", code: discountCode.trim() })
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
          serviceId: localizedService?.serviceId || localizedService?.service_id || localizedService?.id,
          modelId: model.id,
          originalPrice: localizedService?.originalPrice ?? localizedService?.price,
          discountChoice,
          price: discountPreview?.formattedFinalPrice || (localizedService?.price ? formatCurrency(localizedService.price) : null),
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit booking")
      }

      const result = await response.json()

      if (result.success) {
        setBookingSuccess(true)
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
  const originalServicePrice = localizedService?.originalPrice ?? localizedService?.price ?? null
  const finalServicePrice = discountPreview?.finalPrice ?? localizedService?.price ?? null
  const hasBookingDiscount =
    originalServicePrice !== null && finalServicePrice !== null && finalServicePrice < originalServicePrice
  const selectedPersonalDiscountId = discountChoice.type === "personal" ? discountChoice.discountId : null
  const shouldShowDiscountSignupNudge =
    !isRegisteredUser || !discountPreview || discountPreview.personalDiscounts.length === 0

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
                {hasBookingDiscount && originalServicePrice !== null ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 line-through">{formatCurrency(originalServicePrice)}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {finalServicePrice !== null ? formatCurrency(finalServicePrice) : "—"}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {finalServicePrice !== null ? formatCurrency(finalServicePrice) : "—"}
                  </p>
                )}
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

        {originalServicePrice !== null && (localizedService?.serviceId || localizedService?.service_id || localizedService?.id) && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 mb-6 sm:mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <BadgePercent className="h-5 w-5" />
                {t("discountTitle") || "Discount"}
              </h3>
              {discountLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleUseBaseDiscount}
                className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                  discountChoice.type === "none"
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t("noOptionalDiscount") || "No optional discount"}</p>
                    <p className="text-xs text-gray-500">
                      {discountPreview?.baseDiscount
                        ? `${t("baseDiscount") || "Base discount"}: ${discountPreview.baseDiscount.name}`
                        : t("baseDiscount") || "Base price"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(discountPreview?.basePrice ?? originalServicePrice)}
                  </span>
                </div>
              </button>

              {discountPreview?.personalDiscounts.map((discount) => (
                <button
                  key={discount.id}
                  type="button"
                  onClick={() => handleUsePersonalDiscount(discount.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                    selectedPersonalDiscountId === discount.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{discount.name}</p>
                      <p className="text-xs text-gray-500">
                        {discount.remainingUses === null
                          ? t("unlimitedUses") || "Unlimited uses"
                          : `${t("usesLeft") || "Uses left"}: ${discount.remainingUses}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(discount.discountedPrice)}</span>
                  </div>
                </button>
              ))}

              {shouldShowDiscountSignupNudge && (
                <details className="group rounded-md border border-dashed border-gray-300 bg-gray-50/70 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                      {t("discountSignupPrompt") || "Want to get a discount?"}
                    </span>
                    <span className="text-lg leading-none text-gray-400 group-open:hidden">+</span>
                    <span className="hidden text-lg leading-none text-gray-400 group-open:inline">−</span>
                  </summary>

                  <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                    <p className="text-sm leading-6 text-gray-600">
                      {isRegisteredUser
                        ? t("discountSignupRegisteredDescription") || "Personal offers will appear here when they are available for your account."
                        : t("discountSignupDescription") || "Create an account to receive personal discounts and special offers."}
                    </p>
                    {!isRegisteredUser && (
                      <Button asChild size="sm" className="w-full sm:w-auto">
                        <Link href={`/${locale}/auth/register`}>{t("discountSignupButton") || "Create account"}</Link>
                      </Button>
                    )}
                  </div>
                </details>
              )}

              <div className="rounded-md border border-gray-200 p-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900" htmlFor="discountCode">
                  <Ticket className="h-4 w-4" />
                  {t("discountCode") || "Discount code"}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="discountCode"
                    value={discountCode}
                    onChange={(event) => setDiscountCode(event.target.value.toUpperCase())}
                    placeholder="BATTERY20"
                    disabled={submitting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyDiscountCode}
                    disabled={submitting || !discountCode.trim()}
                    className="sm:w-auto"
                  >
                    {t("applyCode") || "Apply"}
                  </Button>
                </div>
                {discountChoice.type === "code" && discountPreview?.codeDiscount && (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    {t("codeApplied") || "Code applied"}: {discountPreview.codeDiscount.name}
                  </p>
                )}
                {discountChoice.type === "code" && discountPreview?.selectionError && (
                  <p className="mt-2 text-xs font-medium text-red-600">{discountPreview.selectionError}</p>
                )}
              </div>
            </div>
          </div>
        )}

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
                  inputMode="tel"
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
                              className={`p-2 text-xs font-medium rounded transition-all ${isSelected
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
                            className={`p-2 text-xs font-medium rounded transition-all ${selectedTime === `${slot.hour.toString().padStart(2, "0")}:00`
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
