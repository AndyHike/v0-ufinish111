import { type NextRequest, NextResponse } from "next/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, appointment, customer } = body

    // Validate required fields
    if (!service || !appointment || !customer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get locale from headers or default to 'uk'
    const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] || "uk"

    // Send confirmation email to customer
    const customerEmailSent = await sendBookingConfirmationEmail(
      customer.email,
      {
        customerName: `${customer.firstName} ${customer.lastName}`,
        service: service.service,
        device: `${service.brand} ${service.model}${service.series ? ` (${service.series})` : ""}`,
        dateTime: appointment.dateTime,
        price: service.price,
        notes: customer.notes,
      },
      locale,
    )

    // Send notification email to admin
    const adminEmailSent = await sendNewBookingNotification(
      {
        service: {
          name: service.service,
          brand: service.brand,
          model: service.model,
          series: service.series,
          price: service.price,
        },
        appointment: {
          dateTime: appointment.dateTime,
        },
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          notes: customer.notes,
        },
      },
      locale,
    )

    if (!customerEmailSent) {
      console.warn("Failed to send confirmation email to customer")
    }

    if (!adminEmailSent) {
      console.warn("Failed to send notification email to admin")
    }

    return NextResponse.json({
      success: true,
      message: "Booking submitted successfully",
    })
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
