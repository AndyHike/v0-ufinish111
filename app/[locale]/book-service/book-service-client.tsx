"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, PhoneIcon as DevicePhoneIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

interface ServiceData {
  brand: string
  model: string
  series?: string
  service: string
  serviceId: string
  price?: number
}

interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  notes: string
}

export default function BookServiceClient() {
  const searchParams = useSearchParams()
  const t = useTranslations("BookService")

  const [serviceData, setServiceData] = useState<ServiceData | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  // Generate time slots from 9:00 to 19:00 with 30-minute intervals
  const timeSlots = []
  for (let hour = 9; hour < 19; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`)
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`)
  }

  useEffect(() => {
    // Get service data from URL parameters
    const brand = searchParams.get("brand")
    const model = searchParams.get("model")
    const series = searchParams.get("series")
    const service = searchParams.get("service")
    const serviceId = searchParams.get("serviceId")
    const price = searchParams.get("price")

    if (brand && model && service && serviceId) {
      setServiceData({
        brand,
        model,
        series: series || undefined,
        service,
        serviceId,
        price: price ? Number.parseFloat(price) : undefined,
      })
    }
  }, [searchParams])

  const isWeekday = (date: Date) => {
    const day = date.getDay()
    return day !== 0 && day !== 6 // Not Sunday (0) or Saturday (6)
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(today.getDate() + 14)

    return date < today || date > twoWeeksFromNow || !isWeekday(date)
  }

  const handleCustomerDataChange = (field: keyof CustomerData, value: string) => {
    setCustomerData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateForm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error(t("fillRequiredFields"))
      return false
    }

    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone) {
      toast.error(t("fillRequiredFields"))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerData.email)) {
      toast.error(t("invalidEmail"))
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm() || !serviceData) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: serviceData,
          appointment: {
            date: selectedDate?.toISOString().split("T")[0],
            time: selectedTime,
            dateTime: `${selectedDate?.toLocaleDateString()} ${selectedTime}`,
          },
          customer: customerData,
        }),
      })

      if (response.ok) {
        toast.success(t("bookingSuccess"))
        // Reset form or redirect
        setStep(1)
        setSelectedDate(undefined)
        setSelectedTime("")
        setCustomerData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        })
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

  if (!serviceData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">{t("invalidParameters")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DevicePhoneIcon className="h-5 w-5" />
            {t("serviceDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">{t("brand")}</Label>
              <p className="font-semibold">{serviceData.brand}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t("model")}</Label>
              <p className="font-semibold">{serviceData.model}</p>
            </div>
            {serviceData.series && (
              <div>
                <Label className="text-sm font-medium text-gray-500">{t("series")}</Label>
                <p className="font-semibold">{serviceData.series}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-500">{t("price")}</Label>
              <p className="font-semibold">{serviceData.price ? `${serviceData.price} Kč` : t("priceOnRequest")}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">{t("service")}</Label>
            <Badge variant="secondary" className="mt-1">
              {serviceData.service}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t("selectDateTime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium mb-3 block">{t("selectDate")}</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  className="rounded-md border"
                />
                <p className="text-sm text-gray-500 mt-2">{t("availabilityNote")}</p>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">{t("selectTime")}</Label>
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className="justify-center"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">{t("workingHoursNote")}</p>
              </div>
            </div>

            {selectedDate && selectedTime && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-900">
                  {t("appointmentDetails")}: {selectedDate.toLocaleDateString()} {t("at")} {selectedTime}
                </p>
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={!selectedDate || !selectedTime} className="w-full">
              {t("customerInfo")}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {t("customerInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t("firstName")} *</Label>
                <Input
                  id="firstName"
                  value={customerData.firstName}
                  onChange={(e) => handleCustomerDataChange("firstName", e.target.value)}
                  placeholder={t("firstNamePlaceholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t("lastName")} *</Label>
                <Input
                  id="lastName"
                  value={customerData.lastName}
                  onChange={(e) => handleCustomerDataChange("lastName", e.target.value)}
                  placeholder={t("lastNamePlaceholder")}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t("email")} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleCustomerDataChange("email", e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("phone")} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => handleCustomerDataChange("phone", e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={customerData.address}
                onChange={(e) => handleCustomerDataChange("address", e.target.value)}
                placeholder={t("addressPlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={customerData.notes}
                onChange={(e) => handleCustomerDataChange("notes", e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                {t("goBack")}
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                {t("bookingSummary")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("bookingSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">{t("device")}</Label>
                <p className="font-semibold">
                  {serviceData.brand} {serviceData.model}
                  {serviceData.series && ` (${serviceData.series})`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">{t("service")}</Label>
                <p className="font-semibold">{serviceData.service}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">{t("dateTime")}</Label>
                <p className="font-semibold">
                  {selectedDate?.toLocaleDateString()} {t("at")} {selectedTime}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">{t("price")}</Label>
                <p className="font-semibold">{serviceData.price ? `${serviceData.price} Kč` : t("priceOnRequest")}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">{t("customerInfo")}</h4>
              <p className="text-blue-800">
                {customerData.firstName} {customerData.lastName}
              </p>
              <p className="text-blue-800">{customerData.email}</p>
              <p className="text-blue-800">{customerData.phone}</p>
              {customerData.address && <p className="text-blue-800">{customerData.address}</p>}
              {customerData.notes && <p className="text-blue-800 text-sm">{customerData.notes}</p>}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                {t("goBack")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t("submitting") : t("confirmBooking")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
