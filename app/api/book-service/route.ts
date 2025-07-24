import { type NextRequest, NextResponse } from "next/server"
import { sendNewContactMessageNotification, sendBookingConfirmation } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, service, model, description, locale = "uk" } = body

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !email || !phone || !service || !model || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Валідація email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Валідація телефону (тільки цифри, пробіли, дефіси, плюс та дужки)
    const phoneRegex = /^[\d\s\-+$$$$]+$/
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Invalid phone format" }, { status: 400 })
    }

    const bookingData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service: service.trim(),
      model: model.trim(),
      description: description.trim(),
    }

    // Відправляємо повідомлення адміністратору
    const adminNotificationSent = await sendNewContactMessageNotification(
      {
        name: `${bookingData.firstName} ${bookingData.lastName}`,
        email: bookingData.email,
        phone: bookingData.phone,
        message: `Service: ${bookingData.service}\nModel: ${bookingData.model}\nDescription: ${bookingData.description}`,
      },
      locale,
    )

    // Відправляємо підтвердження користувачу
    const userConfirmationSent = await sendBookingConfirmation(bookingData.email, bookingData, locale)

    if (!adminNotificationSent) {
      console.error("Failed to send admin notification")
    }

    if (!userConfirmationSent) {
      console.error("Failed to send user confirmation")
    }

    // Повертаємо успішну відповідь навіть якщо один з емейлів не відправився
    return NextResponse.json({
      success: true,
      message: "Booking request submitted successfully",
      emailsSent: {
        admin: adminNotificationSent,
        user: userConfirmationSent,
      },
    })
  } catch (error) {
    console.error("Error processing booking request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
