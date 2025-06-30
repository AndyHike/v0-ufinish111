import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = params
    const body = await request.json()
    const { position, translations } = body

    // Оновлюємо FAQ
    const { error: faqError } = await supabase
      .from("service_faqs")
      .update({ position: position || 0 })
      .eq("id", faqId)

    if (faqError) {
      console.error("Error updating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
    }

    // Видаляємо старі переклади
    await supabase.from("service_faq_translations").delete().eq("faq_id", faqId)

    // Створюємо нові переклади
    const translationData = Object.entries(translations).map(([locale, data]: [string, any]) => ({
      faq_id: faqId,
      locale,
      question: data.question,
      answer: data.answer,
    }))

    const { error: translationError } = await supabase.from("service_faq_translations").insert(translationData)

    if (translationError) {
      console.error("Error updating FAQ translations:", translationError)
      return NextResponse.json({ error: "Failed to update FAQ translations" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in FAQ PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = params

    const { error } = await supabase.from("service_faqs").delete().eq("id", faqId)

    if (error) {
      console.error("Error deleting FAQ:", error)
      return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in FAQ DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
