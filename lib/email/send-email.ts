import nodemailer from "nodemailer"
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerificationCodeEmailTemplate,
  getNewContactMessageTemplate,
  getBookingConfirmationEmailTemplate,
  getNewBookingNotificationTemplate,
} from "./templates"

// Configure email transporter
function createTransporter() {
  // Trim any whitespace from the hostname to prevent DNS errors
  const host = process.env.EMAIL_SERVER_HOST ? process.env.EMAIL_SERVER_HOST.trim() : ""
  const port = Number.parseInt(process.env.EMAIL_SERVER_PORT || "587")
  const secure = process.env.EMAIL_SERVER_SECURE === "true"
  const user = process.env.EMAIL_SERVER_USER ? process.env.EMAIL_SERVER_USER.trim() : ""
  const pass = process.env.EMAIL_SERVER_PASSWORD || ""

  // Validate the hostname
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
    // Add TLS options to handle weak certificates
    tls: {
      // This option allows Node.js to accept certificates from the server that are considered insecure
      rejectUnauthorized: false,
      // Specify minimum TLS version
      minVersion: "TLSv1",
      // Disable secure context checking
      secureContext: false,
    },
  })
}

export async function sendVerificationEmail(email: string, token: string, locale = "uk") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.trim() : ""
  const verificationLink = `${appUrl}/${locale}/auth/verify?token=${token}`

  const emailTemplate = getVerificationEmailTemplate(verificationLink, locale)

  const translations = {
    en: "Verify your email address",
    uk: "Підтвердіть вашу електронну адресу",
    cs: "Ověřte svou e-mailovou adresu",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  return await sendEmail(email, subject, emailTemplate)
}

export async function sendPasswordResetEmail(email: string, token: string, locale = "uk") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.trim() : ""
  const resetLink = `${appUrl}/${locale}/auth/reset-password?token=${token}`

  const emailTemplate = getPasswordResetEmailTemplate(resetLink, locale)

  const translations = {
    en: "Reset your password",
    uk: "Скидання вашого пароля",
    cs: "Obnovení hesla",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  return await sendEmail(email, subject, emailTemplate)
}

export async function sendVerificationCode(email: string, code: string, locale = "uk", isLogin = true) {
  const emailTemplate = getVerificationCodeEmailTemplate(code, locale, isLogin)

  const translations = {
    en: isLogin ? "Your login verification code" : "Your registration verification code",
    uk: isLogin ? "Ваш код підтвердження входу" : "Ваш код підтвердження реєстрації",
    cs: isLogin ? "Váš ověřovací kód pro přihlášení" : "Váš ověřovací kód pro registraci",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  return await sendEmail(email, subject, emailTemplate)
}

export async function sendNewContactMessageNotification(
  contactMessage: {
    name: string
    email: string
    phone?: string | null
    message: string
  },
  locale = "uk",
) {
  const emailTemplate = getNewContactMessageTemplate(contactMessage, locale)

  const translations = {
    en: "New contact form message",
    uk: "Нове повідомлення з контактної форми",
    cs: "Nová zpráva z kontaktního formuláře",
  }

  const subject = translations[locale as keyof typeof translations] || translations.en

  // Отримуємо адресу для сповіщень з env або використовуємо адресу відправника
  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_FROM?.trim() || "info@devicehelp.cz"

  return await sendEmail(notificationEmail, subject, emailTemplate)
}

export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: {
    customerName: string
    service: string
    device: string
    dateTime: string
    price: number | null
    notes?: string
  },
  locale = "uk",
) {
  const emailTemplate = getBookingConfirmationEmailTemplate(bookingDetails, locale)

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
    service: any
    appointment: any
    customer: any
  },
  locale = "uk",
) {
  const emailTemplate = getNewBookingNotificationTemplate(bookingData, locale)

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
    console.log(`Attempting to send email to ${to} with subject "${subject}"`)

    // Create a new transporter for each email to ensure we have the latest config
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

    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}
