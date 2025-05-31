import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { sendNewContactMessageNotification } from "@/lib/email/send-email"

// Функція для створення таблиці contact_messages, якщо вона не існує
async function ensureContactMessagesTable(supabase: any) {
  try {
    // Перевіряємо, чи існує таблиця
    const { error: tableCheckError } = await supabase.from("contact_messages").select("id").limit(1)

    if (tableCheckError) {
      console.log("Table contact_messages does not exist, creating it...")

      // Створюємо таблицю за допомогою SQL
      const { error: createTableError } = await supabase.rpc("create_contact_messages_table")

      if (createTableError) {
        console.error("Error creating contact_messages table:", createTableError)
        return false
      }

      console.log("Table contact_messages created successfully")
    } else {
      console.log("Table contact_messages already exists")
    }

    return true
  } catch (error) {
    console.error("Error ensuring contact_messages table:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message, locale = "uk" } = body

    console.log("Received contact form submission:", {
      name,
      email,
      phone: phone ? "provided" : "not provided",
      messageLength: message?.length,
    })

    // Валідація
    if (!name || !email || !message) {
      console.log("Validation failed:", { name: !!name, email: !!email, message: !!message })
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Створюємо клієнта Supabase
    const supabase = createClient()

    // Переконуємося, що таблиця існує
    const tableExists = await ensureContactMessagesTable(supabase)

    if (!tableExists) {
      return NextResponse.json({ error: "Failed to ensure contact_messages table exists" }, { status: 500 })
    }

    // Зберігаємо повідомлення в базі даних
    console.log("Inserting contact message into database...")
    const { data: insertData, error: insertError } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          message,
          status: "new",
        },
      ])
      .select()

    if (insertError) {
      console.error("Error inserting contact message:", insertError)
      return NextResponse.json({ error: "Failed to save contact message" }, { status: 500 })
    }

    console.log("Message inserted successfully:", insertData)

    // Надсилаємо сповіщення електронною поштою
    console.log("Sending email notification...")
    const contactMessage = { name, email, phone, message }
    const emailSent = await sendNewContactMessageNotification(contactMessage, locale)
    console.log("Email notification sent:", emailSent)

    // Успішна відповідь
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
