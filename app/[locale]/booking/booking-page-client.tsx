"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, User, CreditCard } from "lucide-react"
import { format, addDays, isWeekend, isBefore, startOfDay } from "date-fns"
import { uk, enUS, cs } from "date-fns/locale"
import { toast } from "sonner"

type BookingData = {
  service: {
    id: string
    slug: string
    name: string
    price: number | null
  }
  model: {
    id: string
    name: string
    slug: string
    image_url: string | null
    brand: {
      id: string
      name: string
      slug: string
      logo_url: string | null
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

type Props = {
  bookingData: BookingData
  locale: string
}

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
  "18:30",
  "19:00",
]

export default function BookingPageClient({ bookingData, locale }: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedService, setSelectedService] = useState(bookingData.service.id)
  const [customerData, setCustomerData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
  })
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dateLocale = locale === "uk" ? uk : locale === "cs" ? cs : enUS

  // Get current selected service details
  const currentService =
    selectedService === bookingData.service.id
      ? bookingData.service
      : bookingData.availableServices.find((s) => s.id === selectedService)

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request"
    return new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
      style: "currency",
      currency: "CZK",
    }).format(price)
  }

  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date())
    const twoWeeksFromNow = addDays(today, 14)

    return isBefore(date, today) || date > twoWeeksFromNow || isWeekend(date)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time")
      return
    }

    if (!customerData.fullName || !customerData.phone || !customerData.email) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          serviceId: selectedService,
          serviceName: currentService?.name,
          brandName: bookingData.model.brand.name,
          modelName: bookingData.model.name,
          seriesName: bookingData.model.series?.name,
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          bookingTime: selectedTime,
          customerName: customerData.fullName,
          customerPhone: customerData.phone,
          customerEmail: customerData.email,
          customerAddress: customerData.address || null,
          price: currentService?.price || null,
          notes: notes || null,
          locale,
        }),
      })

      if (response.ok) {
        toast.success("Booking request sent successfully!")
        // Redirect to success page or home
        router.push(`/${locale}?booking=success`)
      } else {
        throw new Error("Failed to send booking request")
      }
    } catch (error) {
      console.error("Booking error:", error)
      toast.error("Error sending booking request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book a Service</h1>
        <p className="text-muted-foreground">Fill out the form below to book a repair service for your device</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Brand</Label>
                <Input value={bookingData.model.brand.name} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Series</Label>
                <Input value={bookingData.model.series?.name || "N/A"} disabled className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Model</Label>
              <Input value={bookingData.model.name} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={bookingData.service.id}>{bookingData.service.name}</SelectItem>
                  {bookingData.availableServices
                    .filter((s) => s.id !== bookingData.service.id)
                    .map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estimated Price</Label>
              <Input value={formatPrice(currentService?.price || null)} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={customerData.fullName}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                value={customerData.address}
                onChange={(e) => setCustomerData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: dateLocale }) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={isDateDisabled}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Select Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {time}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe the problem or add any comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting || !selectedDate || !selectedTime}>
            {isSubmitting ? "Submitting..." : "Book Service"}
          </Button>
        </div>
      </form>
    </div>
  )
}
