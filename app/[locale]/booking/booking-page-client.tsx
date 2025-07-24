"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Phone, Mail, User, MapPin, FileText, Wrench, Smartphone } from "lucide-react"
import { format, addDays, isWeekend } from "date-fns"
import { uk, cs, enUS } from "date-fns/locale"
import { useLocale } from "next-intl"
import { toast } from "sonner"

interface ServiceInfo {
  id: string
  name: string
  price: number | null
}

interface ModelInfo {
  id: string
  name: string
  brand_name: string
  series_name: string
  services: ServiceInfo[]
}

export default function BookingPageClient() {
  const t = useTranslations("booking")
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()

  // Get URL parameters
  const serviceId = searchParams.get("serviceId")
  const modelId = searchParams.get("modelId")

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>(serviceId || "")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data state
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Generate time slots (9:00 - 19:00)
  const timeSlots = []
  for (let hour = 9; hour < 19; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`)
    timeSlots.push(`${hour.toString().padStart(2, "0")}:30`)
  }

  // Date locale mapping
  const dateLocales = {
    uk: uk,
    cs: cs,
    en: enUS,
  }

  useEffect(() => {
    if (!modelId) {
      router.push("/")
      return
    }

    // Fetch model info and services
    const fetchModelInfo = async () => {
      try {
        const response = await fetch(`/api/models/${modelId}`)
        if (response.ok) {
          const data = await response.json()
          setModelInfo(data)
        }
      } catch (error) {
        console.error("Error fetching model info:", error)
        toast.error(t("errorMessage"))
      } finally {
        setLoading(false)
      }
    }

    fetchModelInfo()
  }, [modelId, router, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime || !selectedService || !customerName || !customerEmail || !customerPhone) {
      toast.error(t("fillRequired"))
      return
    }

    if (!selectedDate || !selectedTime) {
      toast.error(t("selectDateTime"))
      return
    }

    setIsSubmitting(true)

    try {
      const selectedServiceInfo = modelInfo?.services.find((s) => s.id === selectedService)

      const bookingData = {
        serviceId: selectedService,
        serviceName: selectedServiceInfo?.name || "",
        modelId: modelInfo?.id || "",
        modelName: modelInfo?.name || "",
        brandName: modelInfo?.brand_name || "",
        seriesName: modelInfo?.series_name || "",
        bookingDate: format(selectedDate, "yyyy-MM-dd"),
        bookingTime: selectedTime,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress: customerAddress || null,
        notes: notes || null,
        price: selectedServiceInfo?.price || null,
        locale,
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (response.ok) {
        toast.success(t("successMessage"))
        // Reset form
        setSelectedDate(undefined)
        setSelectedTime("")
        setCustomerName("")
        setCustomerEmail("")
        setCustomerPhone("")
        setCustomerAddress("")
        setNotes("")
      } else {
        toast.error(t("errorMessage"))
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      toast.error(t("errorMessage"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedServiceInfo = modelInfo?.services.find((s) => s.id === selectedService)

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading...</div>
  }

  if (!modelInfo) {
    return <div className="text-center py-8">{t("errorMessage")}</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t("serviceInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {t("brand")}
                </Label>
                <Input value={modelInfo.brand_name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>{t("series")}</Label>
                <Input value={modelInfo.series_name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>{t("model")}</Label>
                <Input value={modelInfo.name} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>{t("service")} *</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectService")} />
                  </SelectTrigger>
                  <SelectContent>
                    {modelInfo.services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedServiceInfo && (
              <div>
                <Label>{t("estimatedPrice")}</Label>
                <div className="text-lg font-semibold text-green-600">
                  {selectedServiceInfo.price
                    ? new Intl.NumberFormat(locale === "cs" ? "cs-CZ" : locale === "uk" ? "uk-UA" : "en-US", {
                        style: "currency",
                        currency: "CZK",
                      }).format(selectedServiceInfo.price)
                    : t("priceOnRequest")}
                </div>
              </div>
            )}
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
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("fullName")} *
                </Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t("phone")} *
                </Label>
                <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("email")} *
                </Label>
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("address")} ({t("optional")})
                </Label>
                <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t("dateTime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t("selectDate")} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP", {
                            locale: dateLocales[locale as keyof typeof dateLocales],
                          })
                        : t("pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date > addDays(new Date(), 14) || isWeekend(date)}
                      initialFocus
                      locale={dateLocales[locale as keyof typeof dateLocales]}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("selectTime")} *
                </Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("pickTime")} />
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
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("additionalNotes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto px-8">
            {isSubmitting ? t("submitting") : t("bookService")}
          </Button>
        </div>
      </form>
    </div>
  )
}
