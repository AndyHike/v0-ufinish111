import { type NextRequest, NextResponse } from "next/server"
import { sendNewContactMessageNotification, sendEmail } from "@/lib/email/send-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, date, time, comment, service, brand, model, price, locale } = body

    // Валідація обов'язкових полів
    if (!firstName || !lastName || !phone || !email || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const fullName = `${firstName} ${lastName}`

    // Форматуємо дату для відображення
    const formattedDate = new Date(date).toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Формуємо повідомлення для адміна
    const serviceInfo = service ? `${service}${brand && model ? ` (${brand} ${model})` : ""}` : "Не вказано"
    const priceInfo = price ? ` - ${price}` : ""

    const adminMessage = `
НОВЕ БРОНЮВАННЯ ПОСЛУГИ

Послуга: ${serviceInfo}${priceInfo}
Дата: ${formattedDate}
Час: ${time}

КЛІЄНТ:
Ім'я: ${fullName}
Телефон: ${phone}
Email: ${email}

${comment ? `Додаткова інформація:\n${comment}` : ""}

---
Це автоматичне повідомлення з системи бронювання.
    `.trim()

    // Відправляємо емейл адміну
    const adminEmailSent = await sendNewContactMessageNotification(
      {
        name: fullName,
        email: email,
        phone: phone,
        message: adminMessage,
      },
      locale,
    )

    // Відправляємо підтвердження клієнту
    const clientEmailSent = await sendBookingConfirmationEmail(
      email,
      {
        name: fullName,
        service: serviceInfo,
        date: formattedDate,
        time,
        phone,
        comment,
      },
      locale,
    )

    if (!adminEmailSent) {
      console.error("Failed to send admin notification email")
    }

    if (!clientEmailSent) {
      console.error("Failed to send client confirmation email")
    }

    return NextResponse.json({
      success: true,
      message: "Booking request sent successfully",
      emailsSent: {
        admin: adminEmailSent,
        client: clientEmailSent,
      },
    })
  } catch (error) {
    console.error("Error processing booking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Функція для відправки підтвердження клієнту
async function sendBookingConfirmationEmail(
  email: string,
  bookingData: {
    name: string
    service: string
    date: string
    time: string
    phone: string
    comment?: string
  },
  locale: string,
) {
  const translations = {
    en: {
      subject: "Booking Confirmation - Mobile Repair Service",
      title: "Booking Confirmation",
      greeting: "Hello",
      message:
        "Thank you for your booking request. We have received your information and will contact you soon to confirm the appointment.",
      details: "Booking Details:",
      service: "Service:",
      date: "Date:",
      time: "Time:",
      phone: "Phone:",
      comment: "Additional Information:",
      footer: "We will contact you within 24 hours to confirm your appointment.",
      regards: "Best regards,\nMobile Repair Service Team",
    },
    uk: {
      subject: "Підтвердження бронювання - Сервіс ремонту мобільних",
      title: "Підтвердження бронювання",
      greeting: "Вітаємо",
      message:
        "Дякуємо за ваш запит на бронювання. Ми отримали вашу інформацію і незабаром зв'яжемося з вами для підтвердження зустрічі.",
      details: "Деталі бронювання:",
      service: "Послуга:",
      date: "Дата:",
      time: "Час:",
      phone: "Телефон:",
      comment: "Додаткова інформація:",
      footer: "Ми зв'яжемося з вами протягом 24 годин для підтвердження зустрічі.",
      regards: "З повагою,\nКоманда сервісу ремонту мобільних",
    },
    cs: {
      subject: "Potvrzení rezervace - Servis mobilních telefonů",
      title: "Potvrzení rezervace",
      greeting: "Dobrý den",
      message:
        "Děkujeme za váš požadavek na rezervaci. Obdrželi jsme vaše informace a brzy vás budeme kontaktovat pro potvrzení schůzky.",
      details: "Detaily rezervace:",
      service: "Služba:",
      date: "Datum:",
      time: "Čas:",
      phone: "Telefon:",
      comment: "Dodatečné informace:",
      footer: "Budeme vás kontaktovat do 24 hodin pro potvrzení schůzky.",
      regards: "S pozdravem,\nTým servisu mobilních telefonů",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; border-radius: 5px; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; margin: -20px -20px 20px -20px; }
        .details { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .label { font-weight: bold; }
        .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${t.title}</h2>
        </div>
        <p>${t.greeting} ${bookingData.name},</p>
        <p>${t.message}</p>
        <div class="details">
          <h3>${t.details}</h3>
          <p><span class="label">${t.service}</span> ${bookingData.service}</p>
          <p><span class="label">${t.date}</span> ${bookingData.date}</p>
          <p><span class="label">${t.time}</span> ${bookingData.time}</p>
          <p><span class="label">${t.phone}</span> ${bookingData.phone}</p>
          ${bookingData.comment ? `<p><span class="label">${t.comment}</span> ${bookingData.comment}</p>` : ""}
        </div>
        <div class="footer">
          <p>${t.footer}</p>
          <p>${t.regards}</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    return await sendEmail(email, t.subject, emailTemplate)
  } catch (error) {
    console.error("Error sending client confirmation email:", error)
    return false
  }
}
