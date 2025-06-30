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
      console.error("Error fetching FAQs:", error)
      return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
    }

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("Error in GET /api/admin/services/[id]/faqs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { id: serviceId } = params
    const body = await request.json()

    const { position, translations } = body

    // Створюємо FAQ
    const { data: faq, error: faqError } = await supabase
      .from("service_faqs")
      .insert({
        service_id: serviceId,
        position,
      })
      .select()
      .single()

    if (faqError) {
      console.error("Error creating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
    }

    // Створюємо переклади
    const translationInserts = Object.entries(translations).map(([locale, translation]: [string, any]) => ({
      faq_id: faq.id,
      locale,
      question: translation.question,
      answer: translation.answer,
    }))

    const { error: translationsError } = await supabase.from("service_faq_translations").insert(translationInserts)

    if (translationsError) {
      console.error("Error creating FAQ translations:", translationsError)
      // Видаляємо створений FAQ якщо переклади не створилися
      await supabase.from("service_faqs").delete().eq("id", faq.id)
      return NextResponse.json({ error: "Failed to create FAQ translations" }, { status: 500 })
    }

    return NextResponse.json({ faq })
  } catch (error) {
    console.error("Error in POST /api/admin/services/[id]/faqs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
