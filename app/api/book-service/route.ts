import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-booking-email"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, brand, model, series, date, time, customer, locale } = body

    // Generate unique booking ID
    const bookingId = uuidv4().substring(0, 8).toUpperCase()

    // Format date and time for emails
    const dateTime = `${date} ${time}`

    // Send confirmation email to customer
    const customerEmailSent = await sendBookingConfirmationEmail(
      customer.email,
      {
        customerName: `${customer.firstName} ${customer.lastName}`,
        service: service.name,
        brand,
        model,
        series,
        price: service.price,
        date,
        time,
        notes: customer.notes,
      },
      locale,
    )

    // Send notification email to admin
    const adminEmailSent = await sendNewBookingNotification(
      {
        service: {
          name: service.name,
          price: service.price,
          brand,
          model,
          series,
        },
        appointment: {
          dateTime,
          date,
          time,
        },
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
        },
        bookingId,
      },
      locale,
    )

    if (customerEmailSent && adminEmailSent) {
      return NextResponse.json({
        success: true,
        message: "Booking submitted successfully",
        bookingId,
      })
    } else {
      console.error("Failed to send one or both emails")
      return NextResponse.json({ success: false, message: "Failed to send confirmation emails" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing booking:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
