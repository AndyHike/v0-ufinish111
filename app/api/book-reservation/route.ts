import { type NextRequest, NextResponse } from "next/server"
import { sendNewContactMessageNotification, sendEmail } from "@/lib/email/send-email"
import { sendTelegramNotification } from "@/lib/telegram/send-telegram"
import { getSession } from "@/lib/auth/session"
import { formatCurrency } from "@/lib/format-currency"
import {
  type BookingDiscountChoice,
  recordDiscountUsage,
  resolveBookingDiscount,
} from "@/lib/discounts/booking-discounts"

function normalizeDiscountChoice(value: any): BookingDiscountChoice {
  if (value?.type === "personal" && typeof value.discountId === "string") {
    return { type: "personal", discountId: value.discountId }
  }
  if (value?.type === "code" && typeof value.code === "string") {
    return { type: "code", code: value.code }
  }
  return { type: "none" }
}

type IncomingLine = {
  serviceId?: string
  modelId?: string
  serviceName?: string
  brandName?: string
  modelName?: string
  originalPrice?: number | string
  discountChoice?: unknown
}

type ResolvedLine = {
  serviceName: string
  brandName: string
  modelName: string
  originalPrice: number
  finalPrice: number
  formattedFinalPrice: string
  discountLabel: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone, email, date, time, comment, locale, lines } = body as {
      firstName?: string
      lastName?: string
      phone?: string
      email?: string
      date?: string
      time?: string
      comment?: string
      locale?: string
      lines?: IncomingLine[]
    }

    if (!firstName || !lastName || !phone || !email || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: "Reservation has no services" }, { status: 400 })
    }

    const fullName = `${firstName} ${lastName}`
    const session = await getSession()
    const userId = session?.user?.id

    const formattedDate = new Date(date).toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Resolve each line independently so a code scoped to one service never
    // touches another. Usage is recorded per applied line (1 application = 1
    // usage), matching recordDiscountUsage's contract.
    const resolved: ResolvedLine[] = []

    for (const line of lines) {
      const originalPrice = Number(line.originalPrice)
      const canResolve =
        Boolean(line.serviceId) &&
        Boolean(line.modelId) &&
        Number.isFinite(originalPrice) &&
        originalPrice > 0

      const pricing = canResolve
        ? await resolveBookingDiscount({
            serviceId: line.serviceId!,
            modelId: line.modelId!,
            originalPrice,
            locale,
            userId,
            discountChoice: normalizeDiscountChoice(line.discountChoice),
          })
        : null

      if (pricing?.usageDiscountId) {
        try {
          await recordDiscountUsage({
            discountId: pricing.usageDiscountId,
            userId,
            originalPrice: pricing.originalPrice,
            finalPrice: pricing.finalPrice,
          })
        } catch (usageError) {
          // A used-up code shouldn't kill the whole reservation; fall back to
          // the base price for this line and keep going.
          console.error("Reservation discount usage failed:", usageError)
        }
      }

      const finalPrice = pricing ? pricing.finalPrice : Number.isFinite(originalPrice) ? originalPrice : 0
      resolved.push({
        serviceName: line.serviceName || "Service",
        brandName: line.brandName || "",
        modelName: line.modelName || "",
        originalPrice: Number.isFinite(originalPrice) ? originalPrice : 0,
        finalPrice,
        formattedFinalPrice: pricing ? pricing.formattedFinalPrice : formatCurrency(finalPrice),
        discountLabel: pricing?.appliedDiscount
          ? `${pricing.appliedDiscount.name} (${pricing.appliedDiscount.code})`
          : null,
      })
    }

    const total = resolved.reduce((sum, line) => sum + line.finalPrice, 0)
    const formattedTotal = formatCurrency(total)

    // Admin notification (email) — reuse the contact-message channel.
    const adminMessageLines = [
      "НОВА РЕЗЕРВАЦІЯ (кілька послуг)",
      "",
      `Дата: ${formattedDate}`,
      `Час: ${time}`,
      "",
      "ПОСЛУГИ:",
      ...resolved.map((line, index) => {
        const device = [line.brandName, line.modelName].filter(Boolean).join(" ")
        const discount = line.discountLabel ? ` | Знижка: ${line.discountLabel}` : ""
        return `${index + 1}. ${line.serviceName}${device ? ` (${device})` : ""} - ${line.formattedFinalPrice}${discount}`
      }),
      "",
      `РАЗОМ: ${formattedTotal}`,
      "",
      "КЛІЄНТ:",
      `Ім'я: ${fullName}`,
      `Телефон: ${phone}`,
      `Email: ${email}`,
      comment ? `\nКоментар:\n${comment}` : "",
      "",
      "---",
      "Це автоматичне повідомлення з системи резервації.",
    ]

    const adminEmailSent = await sendNewContactMessageNotification(
      { name: fullName, email, phone, message: adminMessageLines.filter((l) => l !== undefined).join("\n") },
      locale,
    )

    // Client confirmation email.
    const clientEmailSent = await sendReservationConfirmationEmail(
      email,
      { name: fullName, date: formattedDate, time, phone, comment, lines: resolved, formattedTotal },
      locale || "cs",
    )

    // Telegram.
    const telegramMessage = [
      `📋 <b>Нова резервація (${resolved.length} послуг)</b>`,
      ``,
      `<b>Дата:</b> ${formattedDate}`,
      `<b>Час:</b> ${time}`,
      ``,
      ...resolved.map((line, index) => {
        const device = [line.brandName, line.modelName].filter(Boolean).join(" ")
        const discount = line.discountLabel ? ` · <i>${line.discountLabel}</i>` : ""
        return `${index + 1}. <b>${line.serviceName}</b>${device ? ` (${device})` : ""} — ${line.formattedFinalPrice}${discount}`
      }),
      ``,
      `<b>Разом:</b> ${formattedTotal}`,
      ``,
      `<b>Клієнт:</b> ${fullName}`,
      `<b>Телефон:</b> ${phone}`,
      `<b>Email:</b> ${email}`,
      comment ? `\n<b>Коментар:</b> ${comment}` : null,
    ]
      .filter((value) => value !== null && value !== undefined)
      .join("\n")

    const telegramSent = await sendTelegramNotification(telegramMessage)

    return NextResponse.json({
      success: true,
      message: "Reservation sent successfully",
      total: formattedTotal,
      emailsSent: { admin: adminEmailSent, client: clientEmailSent },
      telegramSent,
    })
  } catch (error) {
    console.error("Error processing reservation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendReservationConfirmationEmail(
  email: string,
  data: {
    name: string
    date: string
    time: string
    phone: string
    comment?: string
    lines: ResolvedLine[]
    formattedTotal: string
  },
  locale: string,
) {
  const translations = {
    en: {
      subject: "Reservation Confirmation - Mobile Repair Service",
      title: "Reservation Confirmation",
      greeting: "Hello",
      message:
        "Thank you for your reservation. We have received the list of services and will contact you soon to confirm the appointment.",
      services: "Services",
      total: "Total",
      date: "Date",
      time: "Time",
      phone: "Phone",
      comment: "Additional Information",
      address: "Address",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Contact Phone",
      paymentInfo: "Payment Information",
      paymentDetails: "Payment is made after the service is completed. We accept cash, QR code payments, and bank transfers.",
      footer: "We will contact you within 24 hours to confirm your appointment.",
      regards: "Best regards,\nMobile Repair Service Team",
    },
    uk: {
      subject: "Підтвердження резервації - Сервіс ремонту мобільних",
      title: "Підтвердження резервації",
      greeting: "Вітаємо",
      message:
        "Дякуємо за вашу резервацію. Ми отримали список послуг і незабаром зв'яжемося з вами для підтвердження зустрічі.",
      services: "Послуги",
      total: "Разом",
      date: "Дата",
      time: "Час",
      phone: "Телефон",
      comment: "Додаткова інформація",
      address: "Адреса",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Телефон для зв'язку",
      paymentInfo: "Інформація про оплату",
      paymentDetails: "Оплата здійснюється після виконання послуги. Приймаємо готівку, оплату QR кодом та банківський переказ.",
      footer: "Ми зв'яжемося з вами протягом 24 годин для підтвердження зустрічі.",
      regards: "З повагою,\nКоманда сервісу ремонту мобільних",
    },
    cs: {
      subject: "Potvrzení rezervace - Servis mobilních telefonů",
      title: "Potvrzení rezervace",
      greeting: "Dobrý den",
      message:
        "Děkujeme za vaši rezervaci. Obdrželi jsme seznam služeb a brzy vás budeme kontaktovat pro potvrzení schůzky.",
      services: "Služby",
      total: "Celkem",
      date: "Datum",
      time: "Čas",
      phone: "Telefon",
      comment: "Dodatečné informace",
      address: "Adresa",
      addressDetails: "Bělohorská 209/133, 169 00 Praha 6-Břevnov",
      contactPhone: "Kontaktní telefon",
      paymentInfo: "Informace o platbě",
      paymentDetails: "Platba se provádí po dokončení služby. Přijímáme hotovost, platbu QR kódem a bankovní převod.",
      footer: "Budeme vás kontaktovat do 24 hodin pro potvrzení schůzky.",
      regards: "S pozdravem,\nTým servisu mobilních telefonů",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.en

  const rows = data.lines
    .map((line) => {
      const device = [line.brandName, line.modelName].filter(Boolean).join(" ")
      const discount = line.discountLabel
        ? `<div style="font-size:12px;color:#059669;">${line.discountLabel}</div>`
        : ""
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#1f2937;">${line.serviceName}</div>
            ${device ? `<div style="font-size:13px;color:#6b7280;">${device}</div>` : ""}
            ${discount}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#1f2937;white-space:nowrap;">
            ${line.formattedFinalPrice}
          </td>
        </tr>`
    })
    .join("")

  const emailTemplate = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>${t.title}</title></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f9fafb;">
    <div style="background:white;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#1f2937 0%,#374151 100%);color:white;padding:24px;border-radius:8px;margin:-32px -32px 24px -32px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:600;">${t.title}</h1>
      </div>

      <p><strong>${t.greeting} ${data.name},</strong></p>
      <p>${t.message}</p>

      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #3b82f6;">
        <h3 style="margin-top:0;color:#1f2937;">${t.services}</h3>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;margin-top:6px;">
          <span style="font-weight:700;color:#374151;">${t.total}</span>
          <span style="font-size:18px;font-weight:700;color:#059669;">${data.formattedTotal}</span>
        </div>
      </div>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;"><strong>${t.date}:</strong> ${data.date}</p>
        <p style="margin:0 0 6px;"><strong>${t.time}:</strong> ${data.time}</p>
        <p style="margin:0;"><strong>${t.phone}:</strong> ${data.phone}</p>
        ${data.comment ? `<p style="margin:6px 0 0;"><strong>${t.comment}:</strong> ${data.comment}</p>` : ""}
      </div>

      <div style="background:#dbeafe;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #93c5fd;">
        <h4 style="margin:0 0 8px 0;color:#1e40af;">${t.address}</h4>
        <p style="margin:0;font-weight:500;">${t.addressDetails}</p>
        <div style="background:#f3f4f6;border-radius:6px;padding:12px;margin:16px 0 0;font-weight:500;color:#1f2937;">
          ${t.contactPhone}: <strong>+420 775 848 259</strong>
        </div>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:20px 0;border:1px solid #fbbf24;">
        <h4 style="margin:0 0 8px 0;color:#d97706;">${t.paymentInfo}</h4>
        <p style="margin:0;">${t.paymentDetails}</p>
      </div>

      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">
        <p><strong>${t.footer}</strong></p>
        <p style="white-space:pre-line;">${t.regards}</p>
      </div>
    </div>
  </body>
  </html>`

  try {
    return await sendEmail(email, t.subject, emailTemplate)
  } catch (error) {
    console.error("Error sending reservation confirmation email:", error)
    return false
  }
}
