import { createClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Отримуємо інформацію про банер з таблиці settings
    const { data, error } = await supabase.from("settings").select("*").eq("key", "info_banner").single()

    if (error) {
      // Якщо запис не знайдено, повертаємо значення за замовчуванням
      if (error.code === "PGRST116") {
        return NextResponse.json({
          message: "Сайт знаходиться в режимі технічного обслуговування. Деякі функції можуть бути недоступні.",
          enabled: true,
          color: "bg-amber-500 text-white",
        })
      }

      throw error
    }

    return NextResponse.json(data.value)
  } catch (error) {
    console.error("Error fetching banner info:", error)
    return NextResponse.json({ error: "Failed to fetch banner info" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Перевіряємо, чи існує запис
    const { data: existingData } = await supabase.from("settings").select("*").eq("key", "info_banner").single()

    if (existingData) {
      // Оновлюємо існуючий запис
      const { error } = await supabase.from("settings").update({ value: body }).eq("key", "info_banner")

      if (error) throw error
    } else {
      // Створюємо новий запис
      const { error } = await supabase.from("settings").insert([{ key: "info_banner", value: body }])

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating banner info:", error)
    return NextResponse.json({ error: "Failed to update banner info" }, { status: 500 })
  }
}
