export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/send-email"

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
      console.error("Database error:", dbError)
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

    await sendEmail({
      subject: emailSubject[locale as keyof typeof emailSubject] || emailSubject.cs,
      html: emailBody,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing discount request:", error)
    return NextResponse.json({ error: "Failed to process discount request" }, { status: 500 })
  }
}
