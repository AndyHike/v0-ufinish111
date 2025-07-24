import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    const { service, appointment, customer, locale = "uk" } = bookingData

    // Validate required fields
    if (!service || !appointment || !customer) {
      return NextResponse.json({ message: "Missing required booking data" }, { status: 400 })
    }

    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      return NextResponse.json({ message: "Missing required customer information" }, { status: 400 })
    }

    // Send confirmation email to customer
    const customerEmailSent = await sendBookingConfirmationEmail(
      customer.email,
      {
        customerName: `${customer.firstName} ${customer.lastName}`,
        service: service.name,
        device: `${service.brand} ${service.model}`,
        dateTime: appointment.dateTime,
        price: service.price,
        notes: customer.notes,
      },
      locale,
    )

    // Send notification email to admin
    const adminEmailSent = await sendNewBookingNotification(
      {
        service,
        appointment,
        customer,
      },
      locale,
    )

    if (!customerEmailSent && !adminEmailSent) {
      return NextResponse.json({ message: "Failed to send notification emails" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Booking submitted successfully",
        emailsSent: {
          customer: customerEmailSent,
          admin: adminEmailSent,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Booking submission error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
