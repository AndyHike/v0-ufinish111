import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

export async function GET(request: Request) {
  try {
    // Отримуємо сесію користувача
    const session = await getSession()

    if (!session || !session.user) {
      console.log("[contact-messages] No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[contact-messages] User ID:", session.user.id)
    console.log("[contact-messages] User role:", session.user.role)

    // Отримуємо параметри запиту
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Обчислюємо offset для пагінації
    const offset = (page - 1) * limit

    // Створюємо клієнта Supabase
    const supabase = createClient()

    // Перевіряємо, чи існує таблиця contact_messages
    const { error: tableCheckError } = await supabase.from("contact_messages").select("id").limit(1)

    if (tableCheckError && tableCheckError.code === "42P01") {
      // Таблиця не існує, створюємо її
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS contact_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      const { error: createError } = await supabase.rpc("exec", { query: createTableQuery })

      if (createError) {
        console.error("[contact-messages] Error creating contact_messages table:", createError)
        return NextResponse.json({ error: "Failed to create contact_messages table" }, { status: 500 })
      }

      console.log("[contact-messages] Table contact_messages created successfully")
    }

    // Базовий запит
    let query = supabase.from("contact_messages").select("*", { count: "exact" })

    // Додаємо фільтр за статусом, якщо він вказаний
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Додаємо пошук, якщо він вказаний
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Додаємо пагінацію та сортування
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    // Виконуємо запит
    const { data, error, count } = await query

    if (error) {
      console.error("[contact-messages] Error fetching contact messages:", error)
      return NextResponse.json({ error: "Failed to fetch contact messages" }, { status: 500 })
    }

    // Обчислюємо загальну кількість сторінок
    const totalPages = count ? Math.ceil(count / limit) : 0

    // Успі��на відповідь
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages,
      },
    })
  } catch (error) {
    console.error("[contact-messages] Error in contact messages API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
