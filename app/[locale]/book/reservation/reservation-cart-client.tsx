"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  BadgePercent,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Ticket,
  Trash2,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format-currency"
import { getBookingDiscountPreview } from "@/app/actions/booking-discounts"
import { getLocalizedServiceNames } from "@/app/actions/reservation-i18n"
import type { BookingDiscountChoice, BookingDiscountSummary } from "@/lib/discounts/booking-discounts"
import { useReservationCart } from "@/components/booking/reservation-cart-provider"
import type { ReservationCartLine } from "@/lib/booking/reservation-cart"

const phoneCountryCode: Record<string, string> = { uk: "+380", en: "+44", cs: "+420" }

export default function ReservationCartClient({ locale }: { locale: string }) {
  const t = useTranslations("StandaloneBooking")
  const { lines, hydrated, removeLine, setLineDiscount, clear } = useReservationCart()

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", comment: "" })
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [previews, setPreviews] = useState<Record<string, BookingDiscountSummary | null>>({})
  // serviceId -> name in the current locale; refreshed whenever the locale or
  // the set of lines changes, so switching language re-translates the cart.
  const [names, setNames] = useState<Record<string, string>>({})
  const serviceIdsKey = lines.map((line) => line.serviceId).join(",")

  useEffect(() => {
    const ids = lines.map((line) => line.serviceId)
    if (ids.length === 0) {
      setNames({})
      return
    }
    let cancelled = false
    getLocalizedServiceNames(ids, locale)
      .then((map) => {
        if (!cancelled) setNames(map)
      })
      .catch(() => {
        // Non-fatal; fall back to the stored name.
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, serviceIdsKey])

  // Auto-fill for logged-in users (same endpoint as the single-service flow).
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/current", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (data?.user) {
          setFormData((prev) => ({
            ...prev,
            firstName: data.user.first_name || (data.user.name ? data.user.name.split(" ")[0] : prev.firstName),
            lastName:
              data.user.last_name || (data.user.name ? data.user.name.split(" ").slice(1).join(" ") : prev.lastName),
            email: data.user.email || prev.email,
            phone: data.user.phone || prev.phone,
          }))
        }
      } catch {
        // Non-fatal; the form stays empty for guests.
      }
    }
    fetchUser()
  }, [])

  const handlePreview = useCallback((id: string, summary: BookingDiscountSummary | null) => {
    setPreviews((prev) => ({ ...prev, [id]: summary }))
  }, [])

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const preview = previews[line.id]
        return sum + (preview ? preview.finalPrice : line.originalPrice)
      }, 0),
    [lines, previews],
  )

  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      if (date.getDay() !== 0) dates.push(date)
    }
    return dates
  }, [])

  const timeSlots = Array.from({ length: 11 }, (_, i) => 9 + i)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !selectedDate || !selectedTime) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/book-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          comment: formData.comment,
          date: selectedDate,
          time: selectedTime,
          locale,
          lines: lines.map((line) => ({
            serviceId: line.serviceId,
            modelId: line.modelId,
            serviceName: names[line.serviceId] ?? line.serviceName,
            brandName: line.brandName,
            modelName: line.modelName,
            originalPrice: line.originalPrice,
            discountChoice: line.discountChoice,
          })),
        }),
      })

      if (!response.ok) throw new Error("Failed to submit reservation")
      const result = await response.json()
      if (result.success) {
        clear()
        setSuccess(true)
      }
    } catch (error) {
      console.error("Error submitting reservation:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("reservationSentTitle") || "Reservation sent"}</h1>
        <p className="mt-2 text-gray-600">
          {t("reservationSentDescription") || "We received your reservation and will contact you to confirm."}
        </p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}`}>{t("goToHomePage") || "Go to home page"}</Link>
        </Button>
      </div>
    )
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("reservationEmptyTitle") || "Your reservation is empty"}</h1>
        <p className="mt-2 text-gray-600">
          {t("reservationEmptyDescription") || "Add services you want done in one visit."}
        </p>
        <Button asChild className="mt-6">
          <Link href={`/${locale}/book`}>{t("addAnotherService") || "Add to cart"}</Link>
        </Button>
      </div>
    )
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null
  const formattedDate = selectedDateObj
    ? selectedDateObj.toLocaleDateString(locale, { day: "numeric", month: "short" })
    : ""

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-12">
      <Link
        href={`/${locale}/book`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-700 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("addAnotherService") || "Add to cart"}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">{t("reservation") || "Reservation"}</h1>

      {/* Lines */}
      <div className="space-y-4">
        {lines.map((line) => (
          <ReservationLineCard
            key={line.id}
            line={line}
            locale={locale}
            displayName={names[line.serviceId]}
            disabled={submitting}
            onRemove={() => removeLine(line.id)}
            onDiscountChange={(choice) => setLineDiscount(line.id, choice)}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <span className="text-base font-semibold text-gray-900">{t("total") || "Total"}</span>
        <span className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</span>
      </div>

      {/* Customer + date/time form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{t("personalInfo") || "Personal Information"}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder={t("firstName")}
              autoComplete="given-name"
              required
              disabled={submitting}
            />
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder={t("lastName")}
              autoComplete="family-name"
              required
              disabled={submitting}
            />
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={`${phoneCountryCode[locale] || "+1"} ...`}
              autoComplete="tel"
              inputMode="tel"
              required
              disabled={submitting}
            />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("email")}
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5" />
            {t("dateTime") || "Date & Time"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("selectDate") || "Date"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker((v) => !v)}
                  className="flex w-full items-center justify-between rounded border border-gray-300 px-3 py-2 text-left text-sm hover:border-gray-400"
                >
                  <span>{formattedDate || (t("selectDate") || "Select date")}</span>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </button>
                {showDatePicker && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 shadow-lg sm:w-72">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{t("selectDate")}</h3>
                      <button type="button" onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid max-h-48 grid-cols-4 gap-1 overflow-y-auto">
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
                            className={`rounded p-2 text-xs font-medium ${
                              isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

            {/* Time */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("selectTime") || "Time"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimePicker((v) => !v)}
                  className="flex w-full items-center justify-between rounded border border-gray-300 px-3 py-2 text-left text-sm hover:border-gray-400"
                >
                  <span>{selectedTime || (t("selectTime") || "Select time")}</span>
                  <Clock className="h-4 w-4 text-gray-400" />
                </button>
                {showTimePicker && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 shadow-lg sm:w-72">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{t("selectTime")}</h3>
                      <button type="button" onClick={() => setShowTimePicker(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {timeSlots.map((hour) => {
                        const value = `${hour.toString().padStart(2, "0")}:00`
                        return (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => {
                              setSelectedTime(value)
                              setShowTimePicker(false)
                            }}
                            className={`rounded p-2 text-xs font-medium ${
                              selectedTime === value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {hour}:00
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">{t("additionalInfo") || "Additional Notes"}</label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            rows={3}
            disabled={submitting}
            placeholder={t("additionalNotesPlaceholder") || "Any additional information..."}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50"
          />
        </div>

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
          className="w-full bg-gray-900 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              {t("submitting") || "Submitting..."}
            </>
          ) : (
            t("submitReservation") || "Confirm reservation"
          )}
        </Button>
      </form>
    </div>
  )
}

function ReservationLineCard({
  line,
  locale,
  displayName,
  disabled,
  onRemove,
  onDiscountChange,
  onPreview,
}: {
  line: ReservationCartLine
  locale: string
  displayName?: string
  disabled: boolean
  onRemove: () => void
  onDiscountChange: (choice: BookingDiscountChoice) => void
  onPreview: (id: string, summary: BookingDiscountSummary | null) => void
}) {
  const t = useTranslations("StandaloneBooking")
  const [preview, setPreview] = useState<BookingDiscountSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState(line.discountChoice.type === "code" ? line.discountChoice.code : "")

  const choiceKey = JSON.stringify(line.discountChoice)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const summary = await getBookingDiscountPreview({
          serviceId: line.serviceId,
          modelId: line.modelId,
          originalPrice: line.originalPrice,
          locale,
          discountChoice: line.discountChoice,
        })
        if (cancelled) return
        setPreview(summary)
        onPreview(line.id, summary)
      } catch (error) {
        console.error("Error fetching reservation discount preview:", error)
        if (!cancelled) {
          setPreview(null)
          onPreview(line.id, null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // choiceKey captures the discount choice; ids/price identify the line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, line.serviceId, line.modelId, line.originalPrice, choiceKey, locale])

  const device = [line.brandName, line.modelName].filter(Boolean).join(" ")
  const finalPrice = preview ? preview.finalPrice : line.originalPrice
  const hasDiscount = preview ? preview.hasDiscount && finalPrice < line.originalPrice : false
  const selectedPersonalId = line.discountChoice.type === "personal" ? line.discountChoice.discountId : null
  const codeError =
    line.discountChoice.type === "code" && preview?.selectionError ? preview.selectionError : null
  const codeApplied = line.discountChoice.type === "code" && preview?.codeDiscount

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{displayName || line.serviceName}</h3>
          {device && <p className="text-sm text-gray-600">{device}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            {hasDiscount && (
              <p className="text-xs text-gray-500 line-through">{formatCurrency(line.originalPrice)}</p>
            )}
            <p className="text-lg font-bold text-gray-900">{formatCurrency(finalPrice)}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={t("remove") || "Remove"}
            className="text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Per-line discount */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <BadgePercent className="h-3.5 w-3.5" />
            {t("discountTitle") || "Discount"}
          </span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </div>

        <div className="space-y-2">
          {/* No optional discount */}
          <button
            type="button"
            onClick={() => onDiscountChange({ type: "none" })}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              line.discountChoice.type === "none" ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-900">
                {preview?.baseDiscount
                  ? `${t("baseDiscount") || "Base discount"}: ${preview.baseDiscount.name}`
                  : t("noOptionalDiscount") || "No optional discount"}
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(preview?.basePrice ?? line.originalPrice)}
              </span>
            </div>
          </button>

          {/* Personal discounts */}
          {preview?.personalDiscounts.map((discount) => (
            <button
              key={discount.id}
              type="button"
              onClick={() => onDiscountChange({ type: "personal", discountId: discount.id })}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selectedPersonalId === discount.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-900">{discount.name}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(discount.discountedPrice)}</span>
              </div>
            </button>
          ))}

          {/* Code */}
          <div className="rounded-md border border-gray-200 p-2.5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Ticket className="h-3.5 w-3.5" />
              {t("discountCode") || "Discount code"}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BATTERY20"
                disabled={disabled}
                className="h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || !code.trim()}
                onClick={() => onDiscountChange({ type: "code", code: code.trim() })}
              >
                {t("applyCode") || "Apply"}
              </Button>
            </div>
            {codeApplied && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {t("codeApplied") || "Code applied"}: {preview?.codeDiscount?.name}
              </p>
            )}
            {codeError && <p className="mt-2 text-xs font-medium text-red-600">{codeError}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
