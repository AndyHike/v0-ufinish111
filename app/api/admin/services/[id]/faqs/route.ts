import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id: serviceId } = params

    const { data: faqs, error } = await supabase
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
      .eq("service_id", serviceId)
      .order("position")

    if (error) {
      console.error("[v0] Error fetching FAQs:", error)
      return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
    }

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("[v0] Error in FAQ GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id: serviceId } = params
    const body = await request.json()
    const { position, translations } = body

    console.log("[v0] Creating FAQ with data:", { serviceId, position, translations })

    // Створюємо FAQ
    const { data: faq, error: faqError } = await supabase
      .from("service_faqs")
      .insert({
        service_id: serviceId,
        position: position || 0,
      })
      .select()
      .single()

    if (faqError) {
      console.error("[v0] Error creating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to create FAQ", details: faqError.message }, { status: 500 })
    }

    // Створюємо переклади
    if (translations && Array.isArray(translations)) {
      const translationInserts = translations
        .filter((t: any) => t.question?.trim() && t.answer?.trim())
        .map((translation: any) => ({
          service_faq_id: faq.id,
          locale: translation.locale,
          question: translation.question.trim(),
          answer: translation.answer.trim(),
        }))

      if (translationInserts.length > 0) {
        const { error: translationError } = await supabase.from("service_faq_translations").insert(translationInserts)

        if (translationError) {
          console.error("[v0] Error creating FAQ translations:", translationError)
          // Видаляємо створений FAQ якщо переклади не вдалося створити
          await supabase.from("service_faqs").delete().eq("id", faq.id)
          return NextResponse.json({ error: "Failed to create FAQ translations", details: translationError.message }, { status: 500 })
        }
      }
    }

    console.log("[v0] FAQ created successfully:", faq.id)
    return NextResponse.json({ faq }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in FAQ POST:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
