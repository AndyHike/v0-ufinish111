import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

interface BookingRequest {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
  date: string
  time: string
  service: string
  brand: string
  model: string
  series?: string
  locale: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    // Валідація обов'язкових полів
    const requiredFields = ["firstName", "lastName", "email", "phone", "date", "time", "service", "brand", "model"]
    for (const field of requiredFields) {
      if (!body[field as keyof BookingRequest]) {
        return NextResponse.json({ error: `Поле ${field} є обов'язковим` }, { status: 400 })
      }
    }

    // Генерація унікального ID бронювання
    const bookingId = uuidv4()

    // Форматування дати для email
    const bookingDate = new Date(body.date)
    const formattedDate = bookingDate.toLocaleDateString("uk-UA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Підготовка даних для email
    const bookingData = {
      id: bookingId,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
      date: formattedDate,
      time: body.time,
      service: body.service,
      brand: body.brand,
      model: body.model,
      series: body.series,
      locale: body.locale,
    }

    // TODO: Тут буде відправка email після створення функцій
    console.log("Booking created:", bookingData)

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Бронювання успішно створено",
    })
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json({ error: "Внутрішня помилка сервера" }, { status: 500 })
  }
}
