import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const faqId = params.faqId
    const body = await request.json()

    const { position, translations } = body

    // Оновлюємо FAQ
    const { error: faqError } = await supabase
      .from("service_faqs")
      .update({
        position: position || 0,
      })
      .eq("id", faqId)

    if (faqError) {
      console.error("Error updating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
    }

    // Оновлюємо переклади
    if (translations && Array.isArray(translations)) {
      for (const translation of translations) {
        const { error: translationError } = await supabase.from("service_faq_translations").upsert({
          service_faq_id: faqId,
          locale: translation.locale,
          question: translation.question,
          answer: translation.answer,
        })

        if (translationError) {
          console.error("Error updating FAQ translation:", translationError)
          return NextResponse.json({ error: "Failed to update FAQ translation" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/admin/services/[id]/faqs/[faqId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const faqId = params.faqId

    const { error } = await supabase.from("service_faqs").delete().eq("id", faqId)

    if (error) {
      console.error("Error deleting FAQ:", error)
      return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/services/[id]/faqs/[faqId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
