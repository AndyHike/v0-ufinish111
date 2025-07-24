"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { uk, enUS, cs } from "date-fns/locale"
import { useLocale } from "next-intl"
import { toast } from "sonner"

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export default function BookingPageClient() {
  const t = useTranslations()
  const locale = useLocale()
  const searchParams = useSearchParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()

  const [formData, setFormData] = useState({
    serviceName: searchParams.get("service") || "",
    brandName: searchParams.get("brand") || "",
    modelName: searchParams.get("model") || "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    bookingTime: "",
    price: searchParams.get("price") || "",
    notes: "",
  })

  const dateLocale = locale === "uk" ? uk : locale === "cs" ? cs : enUS

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !formData.bookingTime) {
      toast.error(t("booking.selectDateTime"))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          bookingDate: selectedDate.toISOString().split("T")[0],
          locale,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        toast.success(t("booking.successMessage"))
      } else {
        toast.error(result.error || t("booking.errorMessage"))
      }
    } catch (error) {
      console.error("Booking error:", error)
      toast.error(t("booking.errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">{t("booking.successTitle")}</h2>
              <p className="text-gray-600">{t("booking.successDescription")}</p>
              <Button onClick={() => (window.location.href = `/${locale}`)} className="mt-4">
                {t("booking.backToHome")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("booking.title")}</CardTitle>
          <CardDescription>{t("booking.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("booking.serviceInfo")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="serviceName">{t("booking.service")}</Label>
                  <Input
                    id="serviceName"
                    value={formData.serviceName}
                    onChange={(e) => handleInputChange("serviceName", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="brandName">{t("booking.brand")}</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange("brandName", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="modelName">{t("booking.model")}</Label>
                  <Input
                    id="modelName"
                    value={formData.modelName}
                    onChange={(e) => handleInputChange("modelName", e.target.value)}
                    required
                  />
                </div>
              </div>

              {formData.price && (
                <div>
                  <Label>{t("booking.estimatedPrice")}</Label>
                  <div className="text-lg font-semibold text-green-600">{formData.price} ₴</div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("booking.customerInfo")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">{t("booking.fullName")}</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">{t("booking.phone")}</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerEmail">{t("booking.email")}</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerAddress">
                  {t("booking.address")} ({t("booking.optional")})
                </Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                />
              </div>
            </div>

            {/* Date and Time Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("booking.dateTime")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t("booking.selectDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP", { locale: dateLocale })
                        ) : (
                          <span>{t("booking.pickDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={
                          (date) =>
                            date < new Date() ||
                            date > new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) ||
                            date.getDay() === 0 // Disable Sundays
                        }
                        initialFocus
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>{t("booking.selectTime")}</Label>
                  <Select
                    value={formData.bookingTime}
                    onValueChange={(value) => handleInputChange("bookingTime", value)}
                  >
                    <SelectTrigger>
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("booking.pickTime")} />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes">
                {t("booking.notes")} ({t("booking.optional")})
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t("booking.notesPlaceholder")}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("booking.submitting") : t("booking.submitBooking")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
