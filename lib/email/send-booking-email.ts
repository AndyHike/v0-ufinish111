import nodemailer from "nodemailer"
import { createBookingConfirmationEmail, createBookingNotificationEmail } from "./templates"

// Configure email transporter
function createTransporter() {
  const host = process.env.EMAIL_SERVER_HOST ? process.env.EMAIL_SERVER_HOST.trim() : ""
  const port = Number.parseInt(process.env.EMAIL_SERVER_PORT || "587")
  const secure = process.env.EMAIL_SERVER_SECURE === "true"
  const user = process.env.EMAIL_SERVER_USER ? process.env.EMAIL_SERVER_USER.trim() : ""
  const pass = process.env.EMAIL_SERVER_PASSWORD || ""

  if (!host) {
    console.error("Email server host is missing or invalid")
    throw new Error("Email configuration error: Invalid host")
  }

  return nodemailer.createTransporter({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1",
      secureContext: false,
    },
  })
}

export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    customerName: string
    service: string
    brand: string
    model: string
    series?: string
    price: number | null
    date: string
    time: string
    notes?: string
  },
  locale = "uk",
) {
  const emailTemplate = createBookingConfirmationEmail({
    customerName: bookingDetails.customerName,
    service: bookingDetails.service,
    brand: bookingDetails.brand,
    model: bookingDetails.model,
    series: bookingDetails.series,
    price: bookingDetails.price,
    date: bookingDetails.date,
    time: bookingDetails.time,
    locale,
  })

  const translations = {
    en: "Booking Confirmation - Phone Repair Service",
    uk: "Підтвердження бронювання - Сервіс ремонту телефонів",
    cs: "Potvrzení rezervace - Servis oprav telefonů",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  return await sendEmail(email, subject, emailTemplate)
}

export async function sendNewBookingNotification(
  bookingData: {
    service: {
      name: string
      price: number | null
      brand: string
      model: string
      series?: string
    }
    appointment: {
      dateTime: string
      date: string
      time: string
    }
    customer: {
      firstName: string
      lastName: string
      email: string
      phone: string
      address?: string
      notes?: string
    }
    bookingId: string
  },
  locale = "uk",
) {
  const emailTemplate = createBookingNotificationEmail({
    customer: bookingData.customer,
    service: bookingData.service.name,
    brand: bookingData.service.brand,
    model: bookingData.service.model,
    series: bookingData.service.series,
    price: bookingData.service.price,
    date: bookingData.appointment.date,
    time: bookingData.appointment.time,
    bookingId: bookingData.bookingId,
    locale,
  })

  const translations = {
    en: "New Service Booking Received",
    uk: "Отримано нове бронювання послуги",
    cs: "Přijata nová rezervace služby",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_FROM?.trim() || "info@devicehelp.cz"

  return await sendEmail(notificationEmail, subject, emailTemplate)
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log(`Attempting to send booking email to ${to} with subject "${subject}"`)

    const transporter = createTransporter()

    const from = process.env.EMAIL_FROM
      ? process.env.EMAIL_FROM.trim()
      : `"Mobile Repair Service" <noreply@example.com>`

    const result = await transporter.sendMail({
      from,
      to: to.trim(),
      subject,
      html,
    })

    console.log(`Booking email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error("Error sending booking email:", error)
    return false
  }
}
