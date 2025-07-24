"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowLeft, Clock } from "lucide-react"
import { format, addDays, isWeekend } from "date-fns"
import { uk, cs, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

type BookingData = {
  service: {
    id: string
    slug: string
    name: string
    description: string
    price: number | null
  }
  brand: {
    id: string
    name: string
    slug: string
  }
  model: {
    id: string
    name: string
    slug: string
  }
  series: {
    id: string
    name: string
    slug: string
  } | null
}

type Props = {
  bookingData: BookingData
  locale: string
}

export default function BookServiceClient({ bookingData, locale }: Props) {
  const t = useTranslations("BookService")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  // Generate time slots from 9:00 to 19:00 with 30-minute intervals
  const timeSlots = []
  for (let hour = 9; hour < 19; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`)
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`)
  }

  // Get date-fns locale
  const dateLocale = locale === "uk" ? uk : locale === "cs" ? cs : enUS

  // Disable weekends and past dates, limit to 2 weeks ahead
  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const twoWeeksFromNow = addDays(today, 14)
    return date < today || date > twoWeeksFromNow || isWeekend(date)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error(t("fillRequiredFields"))
      return false
    }
    if (!formData.lastName.trim()) {
      toast.error(t("fillRequiredFields"))
      return false
    }
    if (!formData.email.trim()) {
      toast.error(t("fillRequiredFields"))
      return false
    }
    if (!formData.phone.trim()) {
      toast.error(t("fillRequiredFields"))
      return false
    }
    if (!selectedDate) {
      toast.error(t("fillRequiredFields"))
      return false
    }
    if (!selectedTime) {
      toast.error(t("fillRequiredFields"))
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t("invalidEmail"))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const bookingPayload = {
        service: {
          name: bookingData.service.name,
          price: bookingData.service.price,
        },
        brand: bookingData.brand.name,
        model: bookingData.model.name,
        series: bookingData.series?.name || null,
        date: format(selectedDate!, "yyyy-MM-dd"),
        time: selectedTime,
        customer: formData,
        locale,
      }

      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      })

      if (response.ok) {
        toast.success(t("bookingSuccess"))
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        })
        setSelectedDate(undefined)
        setSelectedTime("")
      } else {
        toast.error(t("bookingError"))
      }
    } catch (error) {
      console.error("Booking error:", error)
      toast.error(t("bookingError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return t("priceOnRequest")
    return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
      style: "currency",
      currency: "CZK",
    }).format(price)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/services/${bookingData.service.slug}?model=${bookingData.model.slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("goBack")}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Service Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("serviceDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t("brand")}</Label>
                <p className="text-sm text-muted-foreground">{bookingData.brand.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t("model")}</Label>
                <p className="text-sm text-muted-foreground">{bookingData.model.name}</p>
              </div>
              {bookingData.series && (
                <div>
                  <Label className="text-sm font-medium">{t("series")}</Label>
                  <p className="text-sm text-muted-foreground">{bookingData.series.name}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">{t("service")}</Label>
                <p className="text-sm text-muted-foreground">{bookingData.service.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">{t("price")}</Label>
                <p className="text-sm font-semibold">{formatPrice(bookingData.service.price)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t("selectDateTime")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("selectDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? (
                            format(selectedDate, "PPP", { locale: dateLocale })
                          ) : (
                            <span>{t("pickDate")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={isDateDisabled}
                          initialFocus
                          locale={dateLocale}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>{t("selectTime")}</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pickTime")} />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {time}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t("workingHoursNote")}</p>
                  <p>{t("availabilityNote")}</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("customerInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("firstName")} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder={t("firstNamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("lastName")} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder={t("lastNamePlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{t("email")} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t("phone")} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder={t("phonePlaceholder")}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">{t("address")}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t("notes")}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder={t("notesPlaceholder")}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedDate && selectedTime && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("bookingSummary")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{t("appointmentDetails")}</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t("dateTime")}:</strong> {format(selectedDate, "PPP", { locale: dateLocale })} {t("at")}{" "}
                      {selectedTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t("device")}:</strong> {bookingData.brand.name} {bookingData.model.name}
                      {bookingData.series && ` (${bookingData.series.name})`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t("service")}:</strong> {bookingData.service.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>{t("price")}:</strong> {formatPrice(bookingData.service.price)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t("submitting") : t("confirmBooking")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
