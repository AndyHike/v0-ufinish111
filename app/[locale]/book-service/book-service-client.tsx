"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Phone, Mail, User, MapPin } from "lucide-react"
import { format, addDays, isWeekend, setHours, setMinutes } from "date-fns"
import { uk, enUS, cs } from "date-fns/locale"
import { toast } from "sonner"
import { useLocale } from "next-intl"

interface ServiceData {
  id: string
  name: string
  price: number | null
  brand: string
  model: string
  series?: string
}

interface AvailableService {
  id: string
  name: string
  price: number | null
}

export default function BookServiceClient() {
  const t = useTranslations("BookService")
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()

  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [serviceData, setServiceData] = useState<ServiceData | null>(null)
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  // Get date-fns locale
  const getDateLocale = () => {
    switch (locale) {
      case "uk":
        return uk
      case "cs":
        return cs
      default:
        return enUS
    }
  }

  // Generate time slots from 9:00 to 19:00
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
      slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Load service data from URL params
  useEffect(() => {
    const brand = searchParams.get("brand")
    const model = searchParams.get("model")
    const series = searchParams.get("series")
    const serviceId = searchParams.get("serviceId")
    const serviceName = searchParams.get("serviceName")
    const price = searchParams.get("price")

    if (brand && model && serviceId && serviceName) {
      const service: ServiceData = {
        id: serviceId,
        name: serviceName,
        price: price ? Number.parseFloat(price) : null,
        brand,
        model,
        series: series || undefined,
      }
      setServiceData(service)
      setSelectedServiceId(serviceId)

      // Load available services for this model
      loadAvailableServices(brand, model)
    } else {
      toast.error(t("invalidParameters"))
      router.back()
    }
  }, [searchParams, router, t])

  const loadAvailableServices = async (brand: string, model: string) => {
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(model.toLowerCase().replace(/\s+/g, "-"))}`)
      if (response.ok) {
        const data = await response.json()
        if (data.services) {
          setAvailableServices(data.services)
        }
      }
    } catch (error) {
      console.error("Error loading services:", error)
    }
  }

  const handleServiceChange = (newServiceId: string) => {
    const newService = availableServices.find((s) => s.id === newServiceId)
    if (newService && serviceData) {
      setSelectedServiceId(newServiceId)
      setServiceData({
        ...serviceData,
        id: newService.id,
        name: newService.name,
        price: newService.price,
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    const twoWeeksFromNow = addDays(today, 14)

    // Disable weekends and dates outside the 2-week range
    return date < today || date > twoWeeksFromNow || isWeekend(date)
  }

  const validateForm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error(t("selectDateTime"))
      return false
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error(t("fillRequiredFields"))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t("invalidEmail"))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !serviceData) return

    setIsSubmitting(true)

    try {
      const bookingData = {
        service: {
          id: serviceData.id,
          name: serviceData.name,
          price: serviceData.price,
          brand: serviceData.brand,
          model: serviceData.model,
          series: serviceData.series,
        },
        appointment: {
          date: format(selectedDate!, "yyyy-MM-dd"),
          time: selectedTime,
          dateTime: format(
            setMinutes(
              setHours(selectedDate!, Number.parseInt(selectedTime.split(":")[0])),
              Number.parseInt(selectedTime.split(":")[1]),
            ),
            "PPpp",
            { locale: getDateLocale() },
          ),
        },
        customer: formData,
        locale,
      }

      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        toast.success(t("bookingSuccess"))
        // Redirect to success page or home
        router.push(`/${locale}?booking=success`)
      } else {
        const error = await response.json()
        toast.error(error.message || t("bookingError"))
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
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>{t("loading")}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {t("serviceDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{t("brand")}</Label>
              <Input value={serviceData.brand} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label>{t("model")}</Label>
              <Input value={serviceData.model} disabled className="bg-gray-50" />
            </div>
            {serviceData.series && (
              <div>
                <Label>{t("series")}</Label>
                <Input value={serviceData.series} disabled className="bg-gray-50" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("service")}</Label>
              <Select value={selectedServiceId} onValueChange={handleServiceChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("price")}</Label>
              <Input
                value={serviceData.price ? `${serviceData.price} Kč` : t("priceOnRequest")}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date and Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("selectDateTime")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("selectDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: getDateLocale() })
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
                    locale={getDateLocale()}
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

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p>{t("workingHoursNote")}</p>
            <p>{t("availabilityNote")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("customerInfo")}
          </CardTitle>
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
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">{t("phone")} *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t("address")}</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t("addressPlaceholder")}
                className="pl-10"
              />
            </div>
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

      {/* Summary and Submit */}
      <Card>
        <CardHeader>
          <CardTitle>{t("bookingSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedDate && selectedTime && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">{t("appointmentDetails")}</h4>
              <p className="text-green-700">
                <strong>{t("dateTime")}:</strong> {format(selectedDate, "PPP", { locale: getDateLocale() })} {t("at")}{" "}
                {selectedTime}
              </p>
              <p className="text-green-700">
                <strong>{t("service")}:</strong> {serviceData.name}
              </p>
              <p className="text-green-700">
                <strong>{t("device")}:</strong> {serviceData.brand} {serviceData.model}
              </p>
              <p className="text-green-700">
                <strong>{t("price")}:</strong> {serviceData.price ? `${serviceData.price} Kč` : t("priceOnRequest")}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t("goBack")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? t("submitting") : t("confirmBooking")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
