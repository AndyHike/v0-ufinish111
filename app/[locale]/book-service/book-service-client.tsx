"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, PhoneIcon as DevicePhoneMobileIcon } from "lucide-react"
import { toast } from "sonner"

interface BookServiceClientProps {
  service: string
  brand: string
  model: string
  series?: string
  locale: string
}

interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
  date: Date | null
  time: string
}

export default function BookServiceClient({ service, brand, model, series, locale }: BookServiceClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    date: null,
    time: "",
  })

  // Генерація доступних часів (9:00 - 19:00, інтервал 30 хвилин)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour < 19; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`)
      slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return slots
  }

  // Перевірка чи день робочий (пн-пт)
  const isWorkingDay = (date: Date) => {
    const day = date.getDay()
    return day >= 1 && day <= 5 // пн-пт
  }

  // Перевірка чи дата в межах 2 тижнів
  const isDateInRange = (date: Date) => {
    const today = new Date()
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(today.getDate() + 14)

    return date >= today && date <= twoWeeksFromNow
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isWorkingDay(date) && isDateInRange(date)) {
      setBookingData((prev) => ({ ...prev, date, time: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookingData.date || !bookingData.time) {
      toast.error("Будь ласка, оберіть дату та час")
      return
    }

    if (!bookingData.firstName || !bookingData.lastName || !bookingData.email || !bookingData.phone) {
      toast.error("Будь ласка, заповніть всі обов'язкові поля")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingData,
          service,
          brand,
          model,
          series,
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Помилка при відправці бронювання")
      }

      const result = await response.json()

      // Перенаправлення на сторінку успіху
      router.push(`/${locale}/book-service/success?id=${result.bookingId}`)
    } catch (error) {
      console.error("Booking error:", error)
      toast.error("Помилка при відправці бронювання. Спробуйте ще раз.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Інформація про пристрій */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DevicePhoneMobileIcon className="h-5 w-5" />
            Деталі бронювання
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Бренд</Label>
              <Badge variant="secondary" className="mt-1">
                {brand}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Модель</Label>
              <Badge variant="secondary" className="mt-1">
                {model}
              </Badge>
            </div>
            {series && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Серія</Label>
                <Badge variant="secondary" className="mt-1">
                  {series}
                </Badge>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Послуга</Label>
              <Badge variant="outline" className="mt-1">
                {service}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Календар */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Оберіть дату
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={bookingData.date || undefined}
                onSelect={handleDateSelect}
                disabled={(date) => !isWorkingDay(date) || !isDateInRange(date)}
                className="rounded-md border"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Доступні тільки робочі дні (пн-пт) протягом наступних 2 тижнів
              </p>
            </CardContent>
          </Card>

          {/* Вибір часу */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Оберіть час
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={bookingData.time}
                onValueChange={(value) => setBookingData((prev) => ({ ...prev, time: value }))}
                disabled={!bookingData.date}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть час" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">Робочі години: 9:00 - 19:00</p>
            </CardContent>
          </Card>
        </div>

        {/* Контактна інформація */}
        <Card>
          <CardHeader>
            <CardTitle>Контактна інформація</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Ім'я *</Label>
                <Input
                  id="firstName"
                  value={bookingData.firstName}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Прізвище *</Label>
                <Input
                  id="lastName"
                  value={bookingData.lastName}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Додаткові примітки</Label>
              <Textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => setBookingData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Опишіть проблему або додайте будь-які примітки..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Підсумок та кнопка відправки */}
        {bookingData.date && bookingData.time && (
          <Card>
            <CardHeader>
              <CardTitle>Підсумок бронювання</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Пристрій:</strong> {brand} {model} {series && `(${series})`}
                </p>
                <p>
                  <strong>Послуга:</strong> {service}
                </p>
                <p>
                  <strong>Дата:</strong> {bookingData.date.toLocaleDateString("uk-UA")}
                </p>
                <p>
                  <strong>Час:</strong> {bookingData.time}
                </p>
                {bookingData.firstName && bookingData.lastName && (
                  <p>
                    <strong>Клієнт:</strong> {bookingData.firstName} {bookingData.lastName}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting || !bookingData.date || !bookingData.time}
        >
          {isSubmitting ? "Відправка..." : "Підтвердити бронювання"}
        </Button>
      </form>
    </div>
  )
}
