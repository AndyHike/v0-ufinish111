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
        price: price || "Ціна за запитом",
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
    price: string
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
      price: "Price:",
      address: "Address:",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Contact Phone:",
      paymentInfo: "Payment Information:",
      paymentDetails: "Payment is made after the service is completed. We accept cash and card payments.",
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
      price: "Ціна:",
      address: "Адреса:",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Телефон для зв'язку:",
      paymentInfo: "Інформація про оплату:",
      paymentDetails: "Оплата здійснюється після виконання послуги. Приймаємо готівку та картки.",
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
      price: "Cena:",
      address: "Adresa:",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Kontaktní telefon:",
      paymentInfo: "Informace o platbě:",
      paymentDetails: "Platba se provádí po dokončení služby. Přijímáme hotovost i karty.",
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
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 20px; 
        background-color: #f9fafb;
      }
      .container { 
        background: white;
        border-radius: 8px; 
        padding: 32px; 
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .header { 
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        color: white; 
        padding: 24px; 
        border-radius: 8px; 
        margin: -32px -32px 24px -32px; 
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .details { 
        background: #f9fafb; 
        border-radius: 8px; 
        padding: 20px; 
        margin: 20px 0;
        border-left: 4px solid #3b82f6;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .label { 
        font-weight: 600; 
        color: #374151;
        min-width: 120px;
      }
      .value {
        color: #1f2937;
        text-align: right;
        flex: 1;
      }
      .price {
        font-size: 18px;
        font-weight: 700;
        color: #059669;
      }
      .address-section {
        background: #dbeafe;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        border: 1px solid #93c5fd;
      }
      .payment-info {
        background: #fef3c7;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
        border: 1px solid #fbbf24;
      }
      .footer { 
        margin-top: 32px; 
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 14px;
      }
      .contact-info {
        background: #f3f4f6;
        border-radius: 6px;
        padding: 12px;
        margin: 16px 0;
        font-weight: 500;
        color: #1f2937;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${t.title}</h1>
      </div>
      
      <p><strong>${t.greeting} ${bookingData.name},</strong></p>
      <p>${t.message}</p>
      
      <div class="details">
        <h3 style="margin-top: 0; color: #1f2937;">${t.details}</h3>
        
        <div class="detail-row">
          <span class="label">${t.service}</span>
          <span class="value">${bookingData.service}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">${t.price}</span>
          <span class="value price">${bookingData.price}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">${t.date}</span>
          <span class="value">${bookingData.date}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">${t.time}</span>
          <span class="value">${bookingData.time}</span>
        </div>
        
        <div class="detail-row">
          <span class="label">${t.phone}</span>
          <span class="value">${bookingData.phone}</span>
        </div>
        
        ${
          bookingData.comment
            ? `
        <div class="detail-row">
          <span class="label">${t.comment}</span>
          <span class="value">${bookingData.comment}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="address-section">
        <h4 style="margin: 0 0 8px 0; color: #1e40af;">${t.address}</h4>
        <p style="margin: 0; font-weight: 500;">${t.addressDetails}</p>
        <div class="contact-info">
          ${t.contactPhone} <strong>+420 775 848 259</strong>
        </div>
      </div>

      <div class="payment-info">
        <h4 style="margin: 0 0 8px 0; color: #d97706;">${t.paymentInfo}</h4>
        <p style="margin: 0;">${t.paymentDetails}</p>
      </div>
      
      <div class="footer">
        <p><strong>${t.footer}</strong></p>
        <p style="white-space: pre-line;">${t.regards}</p>
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
