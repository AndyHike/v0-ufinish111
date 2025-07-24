import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Generate booking ID
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const fullBookingData = {
      id: bookingId,
      ...bookingData,
    }

    // Send confirmation email to customer
    const customerEmailSent = await sendBookingConfirmationEmail(
      bookingData.customerEmail,
      {
        id: bookingId,
        serviceName: bookingData.serviceName,
        brandName: bookingData.brandName,
        modelName: bookingData.modelName,
        bookingDate: bookingData.bookingDate,
        bookingTime: bookingData.bookingTime,
        customerName: bookingData.customerName,
        price: bookingData.price,
      },
      bookingData.locale,
    )

    // Send notification email to admin
    const adminEmailSent = await sendNewBookingNotification(
      {
        id: bookingId,
        serviceName: bookingData.serviceName,
        brandName: bookingData.brandName,
        modelName: bookingData.modelName,
        bookingDate: bookingData.bookingDate,
        bookingTime: bookingData.bookingTime,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
        customerPhone: bookingData.customerPhone,
        customerAddress: bookingData.customerAddress,
        price: bookingData.price,
        notes: bookingData.notes,
      },
      bookingData.locale,
    )

    if (!customerEmailSent || !adminEmailSent) {
      console.warn("Some emails failed to send")
    }

    return NextResponse.json({
      success: true,
      bookingId,
      emailsSent: { customer: customerEmailSent, admin: adminEmailSent },
    })
  } catch (error) {
    console.error("Error processing booking:", error)
    return NextResponse.json({ error: "Failed to process booking" }, { status: 500 })
  }
}
