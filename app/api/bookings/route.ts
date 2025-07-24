import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      bookingId,
      serviceId,
      serviceName,
      brandName,
      modelName,
      seriesName,
      bookingDate,
      bookingTime,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      price,
      notes,
      locale,
    } = body

    // Validate required fields
    if (
      !bookingId ||
      !serviceName ||
      !brandName ||
      !modelName ||
      !bookingDate ||
      !bookingTime ||
      !customerName ||
      !customerPhone ||
      !customerEmail
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const bookingData = {
      id: bookingId,
      serviceName,
      brandName,
      modelName: seriesName ? `${seriesName} ${modelName}` : modelName,
      bookingDate,
      bookingTime,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      price,
      notes,
    }

    // Send confirmation email to customer
    const customerEmailSent = await sendBookingConfirmationEmail(customerEmail, bookingData, locale)

    // Send notification email to admin
    const adminEmailSent = await sendNewBookingNotification(bookingData, locale)

    if (!customerEmailSent || !adminEmailSent) {
      console.error("Failed to send one or more emails")
    }

    return NextResponse.json({
      success: true,
      bookingId,
      emailsSent: {
        customer: customerEmailSent,
        admin: adminEmailSent,
      },
    })
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
