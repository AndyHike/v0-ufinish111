import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      serviceName,
      brandName,
      modelName,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime,
      price,
      notes,
      locale = "uk",
    } = body

    // Валідація обов'язкових полів
    if (
      !serviceName ||
      !brandName ||
      !modelName ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !bookingDate ||
      !bookingTime
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Генеруємо унікальний ID для бронювання
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const bookingData = {
      id: bookingId,
      serviceName,
      brandName,
      modelName,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime,
      price,
      notes,
    }

    // Відправляємо email підтвердження клієнту
    const confirmationSent = await sendBookingConfirmationEmail(customerEmail, bookingData, locale)

    // Відправляємо сповіщення адміністратору
    const notificationSent = await sendNewBookingNotification(bookingData, locale)

    if (!confirmationSent || !notificationSent) {
      console.warn("Some emails failed to send")
    }

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Booking request sent successfully",
    })
  } catch (error) {
    console.error("Error processing booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
