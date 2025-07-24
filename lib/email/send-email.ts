import nodemailer from "nodemailer"
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerificationCodeEmailTemplate,
  getNewContactMessageTemplate,
} from "./templates"

interface ContactMessage {
  name: string
  email: string
  phone?: string | null
  message: string
}

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

// Експортуємо функцію sendEmail для використання в інших модулях
export async function sendEmail(to: string, subject: string, html: string) {
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

// Функція для відправки підтвердження бронювання користувачу
export async function sendBookingConfirmation(
  userEmail: string,
  bookingData: {
    firstName: string
    lastName: string
    phone: string
    service: string
    model: string
    description: string
  },
  locale = "uk",
) {
  const translations = {
    en: {
      subject: "Service Booking Confirmation",
      title: "Thank you for your booking!",
      greeting: "Dear",
      message: "We have received your service booking request. Our team will contact you soon to confirm the details.",
      details: "Booking Details:",
      service: "Service",
      model: "Device Model",
      phone: "Phone",
      description: "Description",
      footer: "We will contact you within 24 hours to confirm your appointment.",
      regards: "Best regards,<br>Mobile Repair Service Team",
    },
    uk: {
      subject: "Підтвердження бронювання послуги",
      title: "Дякуємо за ваше бронювання!",
      greeting: "Шановний(а)",
      message:
        "Ми отримали ваш запит на бронювання послуги. Наша команда зв'яжеться з вами найближчим часом для підтвердження деталей.",
      details: "Деталі бронювання:",
      service: "Послуга",
      model: "Модель пристрою",
      phone: "Телефон",
      description: "Опис",
      footer: "Ми зв'яжемося з вами протягом 24 годин для підтвердження зустрічі.",
      regards: "З повагою,<br>Команда сервісу ремонту мобільних пристроїв",
    },
    cs: {
      subject: "Potvrzení rezervace služby",
      title: "Děkujeme za vaši rezervaci!",
      greeting: "Vážený(á)",
      message: "Obdrželi jsme vaši žádost o rezervaci služby. Náš tým vás brzy kontaktuje pro potvrzení detailů.",
      details: "Detaily rezervace:",
      service: "Služba",
      model: "Model zařízení",
      phone: "Telefon",
      description: "Popis",
      footer: "Budeme vás kontaktovat do 24 hodin pro potvrzení termínu.",
      regards: "S pozdravem,<br>Tým servisu mobilních zařízení",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.uk

  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.subject}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .container { 
          border: 1px solid #ddd; 
          border-radius: 8px; 
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content { 
          padding: 30px 20px; 
          background: #fff;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .details h3 {
          margin-top: 0;
          color: #4F46E5;
        }
        .detail-row {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #495057;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #6c757d;
          border-top: 1px solid #e9ecef;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${t.title}</h1>
        </div>
        <div class="content">
          <div class="greeting">
            ${t.greeting} ${bookingData.firstName} ${bookingData.lastName},
          </div>
          <p>${t.message}</p>
          
          <div class="details">
            <h3>${t.details}</h3>
            <div class="detail-row">
              <span class="label">${t.service}:</span> ${bookingData.service}
            </div>
            <div class="detail-row">
              <span class="label">${t.model}:</span> ${bookingData.model}
            </div>
            <div class="detail-row">
              <span class="label">${t.phone}:</span> ${bookingData.phone}
            </div>
            <div class="detail-row">
              <span class="label">${t.description}:</span> ${bookingData.description}
            </div>
          </div>
          
          <p>${t.footer}</p>
          <p>${t.regards}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(userEmail, t.subject, emailTemplate)
}
