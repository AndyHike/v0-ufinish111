import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Отримуємо сесію користувача
    const session = await getSession()

    if (!session || !session.user) {
      console.log("[contact-message] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[contact-message] User ID:", session.user.id)
    console.log("[contact-message] User role:", session.user.role)

    const id = params.id

    // Створюємо клієнта Supabase
    const supabase = createClient()

    // Отримуємо повідомлення за ID
    const { data, error } = await supabase.from("contact_messages").select("*").eq("id", id).single()

    if (error) {
      console.error("[contact-message] Error fetching contact message:", error)
      return NextResponse.json({ error: "Failed to fetch contact message" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Contact message not found" }, { status: 404 })
    }

    // Успішна відповідь
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[contact-message] Error in contact message API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Отримуємо сесію користувача
    const session = await getSession()

    if (!session || !session.user) {
      console.log("[contact-message] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[contact-message] User ID:", session.user.id)
    console.log("[contact-message] User role:", session.user.role)

    const id = params.id
    const body = await request.json()
    const { status } = body

    // Валідація
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Створюємо клієнта Supabase
    const supabase = createClient()

    // Оновлюємо ст��тус повідомлення
    const { data, error } = await supabase
      .from("contact_messages")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[contact-message] Error updating contact message:", error)
      return NextResponse.json({ error: "Failed to update contact message" }, { status: 500 })
    }

    // Успішна відповідь
    return NextResponse.json({ data })
  } catch (error) {
    console.error("[contact-message] Error in contact message API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
