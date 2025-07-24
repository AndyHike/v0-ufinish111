import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const {
      serviceId,
      modelId,
      bookingDate,
      bookingTime,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      notes,
      locale = "uk",
    } = body

    // Validate required fields
    if (!serviceId || !modelId || !bookingDate || !bookingTime || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if the time slot is available
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}:00`)

    const { data: existingBooking } = await supabase
      .from("service_bookings")
      .select("id")
      .eq("booking_date", bookingDate)
      .eq("booking_time", bookingTime)
      .eq("status", "confirmed")
      .single()

    if (existingBooking) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 })
    }

    // Get service and model details
    const { data: service } = await supabase
      .from("services")
      .select(`
        id,
        slug,
        services_translations(name, locale)
      `)
      .eq("id", serviceId)
      .single()

    const { data: model } = await supabase
      .from("models")
      .select(`
        id,
        name,
        slug,
        brands(name, slug)
      `)
      .eq("id", modelId)
      .single()

    // Get service price for this model
    const { data: modelService } = await supabase
      .from("model_services")
      .select("price")
      .eq("model_id", modelId)
      .eq("service_id", serviceId)
      .single()

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .insert({
        service_id: serviceId,
        model_id: modelId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        notes: notes || null,
        price: modelService?.price || null,
        status: "confirmed",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Error creating booking:", bookingError)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    // Prepare booking data for emails
    const serviceTranslation = service?.services_translations?.find((t: any) => t.locale === locale)
    const serviceName = serviceTranslation?.name || "Service"

    const bookingData = {
      id: booking.id,
      serviceName,
      brandName: model?.brands?.name || "Unknown",
      modelName: model?.name || "Unknown",
      bookingDate,
      bookingTime,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      price: modelService?.price || null,
      notes: notes || null,
    }

    // Send confirmation email to customer
    await sendBookingConfirmationEmail(customerEmail, bookingData, locale)

    // Send notification email to admin
    await sendNewBookingNotification(bookingData, locale)

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingDate,
        bookingTime,
        serviceName,
        brandName: model?.brands?.name,
        modelName: model?.name,
        price: modelService?.price,
      },
    })
  } catch (error) {
    console.error("Error in booking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
    }

    // Get booked time slots for the date
    const { data: bookings } = await supabase
      .from("service_bookings")
      .select("booking_time")
      .eq("booking_date", date)
      .eq("status", "confirmed")

    const bookedTimes = bookings?.map((b) => b.booking_time) || []

    return NextResponse.json({ bookedTimes })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
