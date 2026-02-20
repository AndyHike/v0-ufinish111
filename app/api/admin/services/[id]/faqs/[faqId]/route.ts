import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = await params

    const { data: faq, error } = await supabase
      .from("service_faqs")
      .select(`
        id,
        position,
        service_faq_translations(
          id,
          locale,
          question,
          answer
        )
      `)
      .eq("id", faqId)
      .single()

    if (error) {
      console.error("Error fetching FAQ:", error)
      return NextResponse.json({ error: "Failed to fetch FAQ" }, { status: 500 })
    }

    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Error in FAQ GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = await params
    const body = await request.json()
    const { position, translations } = body

    console.log("[v0] Updating FAQ:", { faqId, position, translations })

    // Оновлюємо FAQ
    const { error: faqError } = await supabase.from("service_faqs").update({ position }).eq("id", faqId)

    if (faqError) {
      console.error("[v0] Error updating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to update FAQ", details: faqError.message }, { status: 500 })
    }

    // Оновлюємо переклади
    if (translations && Array.isArray(translations)) {
      // Видаляємо старі переклади
      const { error: deleteError } = await supabase.from("service_faq_translations").delete().eq("service_faq_id", faqId)

      if (deleteError) {
        console.error("[v0] Error deleting old FAQ translations:", deleteError)
        return NextResponse.json({ error: "Failed to delete old translations", details: deleteError.message }, { status: 500 })
      }

      // Додаємо нові переклади
      const translationInserts = translations
        .filter((t: any) => t.question?.trim() && t.answer?.trim())
        .map((translation: any) => ({
          service_faq_id: faqId,
          locale: translation.locale,
          question: translation.question.trim(),
          answer: translation.answer.trim(),
        }))

      if (translationInserts.length > 0) {
        const { error: insertError } = await supabase.from("service_faq_translations").insert(translationInserts)

        if (insertError) {
          console.error("[v0] Error inserting FAQ translations:", insertError)
          return NextResponse.json({ error: "Failed to insert translations", details: insertError.message }, { status: 500 })
        }
      }
    }

    console.log("[v0] FAQ updated successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in FAQ PUT:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = await params

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
