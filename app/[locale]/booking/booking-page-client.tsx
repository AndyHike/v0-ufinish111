"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, User, CreditCard, ArrowLeft, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import Link from "next/link"

interface BookingData {
  service: {
    id: string
    slug: string
    name: string
    description: string
    price: number | null
    warranty_months: number | null
    duration_hours: number | null
  }
  model: {
    id: string
    name: string
    slug: string
    brand: {
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
  availableServices: Array<{
    id: string
    slug: string
    name: string
    price: number | null
  }>
}

interface Props {
  bookingData: BookingData
  locale: string
}

export default function BookingPageClient({ bookingData, locale }: Props) {
  const t = useTranslations("Booking")
  const commonT = useTranslations("Common")
  const router = useRouter()

  const [selectedService, setSelectedService] = useState(bookingData.service.id)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Generate available dates (next 14 days, excluding weekends)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    const currentDate = new Date(today)
    currentDate.setDate(currentDate.getDate() + 1) // Start from tomorrow

    while (dates.length < 14) {
      const dayOfWeek = currentDate.getDay()
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  // Generate available time slots (9:00 - 19:00, every hour)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
    }
    return slots
  }

  const availableDates = generateAvailableDates()
  const timeSlots = generateTimeSlots()

  // Fetch booked times when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookedTimes(selectedDate)
    }
  }, [selectedDate])

  const fetchBookedTimes = async (date: string) => {
    try {
      const response = await fetch(`/api/bookings?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setBookedTimes(data.bookedTimes || [])
      }
    } catch (error) {
      console.error("Error fetching booked times:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService,
          modelId: bookingData.model.id,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          notes: customerData.notes,
          locale,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        // Facebook Pixel tracking
        if (typeof window !== "undefined" && window.fbq) {
          const selectedServiceData = bookingData.availableServices.find((s) => s.id === selectedService)
          window.fbq("track", "Purchase", {
            content_type: "service",
            content_id: `service_${selectedService}`,
            content_name: selectedServiceData?.name || bookingData.service.name,
            value: selectedServiceData?.price || bookingData.service.price || 0,
            currency: "CZK",
          })
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Booking failed")
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      alert("Booking failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedServiceData = bookingData.availableServices.find((s) => s.id === selectedService) || bookingData.service

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("bookingConfirmed")}</h2>
            <p className="text-gray-600 mb-6">{t("confirmationEmailSent")}</p>
            <Button asChild className="w-full">
              <Link href={`/${locale}`}>{commonT("backToHome")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${locale}/services/${bookingData.service.slug}?model=${bookingData.model.slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {commonT("back")}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t("bookService")}</h1>
          <p className="text-gray-600 mt-2">{t("selectDateAndTime")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t("selectService")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingData.availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{service.name}</span>
                            <span className="ml-4 font-semibold">
                              {service.price ? formatCurrency(service.price) : t("priceOnRequest")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Date & Time Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {t("selectDateTime")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="date">{t("selectDate")}</Label>
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("chooseDatePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDates.map((date) => (
                          <SelectItem key={date.toISOString()} value={date.toISOString().split("T")[0]}>
                            {date.toLocaleDateString(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDate && (
                    <div>
                      <Label htmlFor="time">{t("selectTime")}</Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("chooseTimePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time} disabled={bookedTimes.includes(time)}>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {time}
                                {bookedTimes.includes(time) && (
                                  <span className="text-red-500 text-sm">({t("booked")})</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("customerInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t("fullName")} *</Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={customerData.name}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={t("enterFullName")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t("email")} *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={customerData.email}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder={t("enterEmail")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">{t("phone")} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={customerData.phone}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder={t("enterPhone")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">{t("address")}</Label>
                      <Input
                        id="address"
                        type="text"
                        value={customerData.address}
                        onChange={(e) => setCustomerData((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder={t("enterAddress")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">{t("additionalNotes")}</Label>
                    <Textarea
                      id="notes"
                      value={customerData.notes}
                      onChange={(e) => setCustomerData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder={t("enterNotes")}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={
                  isSubmitting ||
                  !selectedDate ||
                  !selectedTime ||
                  !customerData.name ||
                  !customerData.email ||
                  !customerData.phone
                }
              >
                {isSubmitting ? t("submitting") : t("confirmBooking")}
              </Button>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>{t("bookingSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{t("device")}</h4>
                  <p className="text-gray-600">
                    {bookingData.model.brand.name} {bookingData.model.name}
                  </p>
                  {bookingData.model.series && <p className="text-sm text-gray-500">{bookingData.model.series.name}</p>}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">{t("service")}</h4>
                  <p className="text-gray-600">{selectedServiceData.name}</p>
                </div>

                {selectedDate && selectedTime && (
                  <div>
                    <h4 className="font-semibold text-gray-900">{t("dateTime")}</h4>
                    <p className="text-gray-600">
                      {new Date(selectedDate).toLocaleDateString(
                        locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US",
                      )}
                    </p>
                    <p className="text-gray-600">{selectedTime}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{t("price")}</span>
                    <span className="font-bold text-lg">
                      {selectedServiceData.price ? formatCurrency(selectedServiceData.price) : t("priceOnRequest")}
                    </span>
                  </div>
                </div>

                {bookingData.service.warranty_months && (
                  <div className="text-sm text-gray-600">
                    <strong>{t("warranty")}:</strong>{" "}
                    {t("warrantyMonths", { count: bookingData.service.warranty_months })}
                  </div>
                )}

                {bookingData.service.duration_hours && (
                  <div className="text-sm text-gray-600">
                    <strong>{t("duration")}:</strong> {t("fromHours", { hours: bookingData.service.duration_hours })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
