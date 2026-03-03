export const dynamic = "force-dynamic"

import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"
import { sendTelegramNotification } from "@/lib/telegram/send-telegram"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, device, service, message, promotion, locale } = body

    const supabase = await createClient()

    // Save to database
    const { error: dbError } = await supabase.from("contact_messages").insert([
      {
        name,
        email,
        phone,
        message: `
Пристрій: ${device || "Не вказано"}
Послуга: ${service || "Не вказано"}
Акція: ${promotion}

Повідомлення:
${message || "Не вказано"}
        `.trim(),
        type: "discount_request",
        locale,
      },
    ])

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      throw dbError
    }

    // Send email notification
    const emailSubject = {
      cs: `Nová žádost o slevu - ${name}`,
      en: `New Discount Request - ${name}`,
      uk: `Нова заявка на знижку - ${name}`,
    }

    const emailBody = `
<h2>Nová žádost o slevu</h2>
<p><strong>Akce:</strong> ${promotion}</p>
<p><strong>Jméno:</strong> ${name}</p>
<p><strong>E-mail:</strong> ${email}</p>
<p><strong>Telefon:</strong> ${phone}</p>
<p><strong>Zařízení:</strong> ${device || "Не вказано"}</p>
<p><strong>Služba:</strong> ${service || "Не вказано"}</p>
${message ? `<p><strong>Zpráva:</strong><br/>${message}</p>` : ""}
    `

    // Отримуємо адресу для сповіщень
    const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_FROM?.trim() || "info@devicehelp.cz"

    await sendEmail(
      notificationEmail,
      emailSubject[locale as keyof typeof emailSubject] || emailSubject.cs,
      emailBody,
      email, // replyTo — email клієнта
    )

    // Відправляємо сповіщення в Telegram
    const telegramMessage = [
      `🏷️ <b>Нова заявка на знижку</b>`,
      ``,
      `<b>Акція:</b> ${promotion}`,
      `<b>Ім'я:</b> ${name}`,
      `<b>Email:</b> ${email}`,
      `<b>Телефон:</b> ${phone}`,
      device ? `<b>Пристрій:</b> ${device}` : null,
      service ? `<b>Послуга:</b> ${service}` : null,
      message ? `\n<b>Повідомлення:</b> ${message}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const telegramSent = await sendTelegramNotification(telegramMessage)
    console.log("Telegram notification sent:", telegramSent)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error processing discount request:", error)
    return NextResponse.json(
      {
        error: "Failed to process discount request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
