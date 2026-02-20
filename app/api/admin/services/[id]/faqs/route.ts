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

    console.log("[v0] Creating FAQ with data:", { serviceId, position, translationsType: typeof translations, isArray: Array.isArray(translations) })

    // Конвертуємо translations до масиву якщо це об'єкт
    let translationEntries: [string, any][] = []

    if (translations) {
      if (Array.isArray(translations)) {
        console.log("[v0] Translations is array with", translations.length, "items")
        translationEntries = translations.map((t) => [t.locale, t])
      } else if (typeof translations === "object") {
        console.log("[v0] Translations is object, converting to array")
        translationEntries = Object.entries(translations)
      }
    }

    console.log("[v0] Translation entries:", translationEntries.map(([locale, _]) => locale))

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

    console.log("[v0] FAQ created with id:", faq.id)

    // Створюємо переклади
    if (translationEntries.length > 0) {
      const translationInserts = translationEntries
        .filter(([locale, translation]: [string, any]) => {
          const hasQuestion = translation?.question?.trim()
          const hasAnswer = translation?.answer?.trim()
          console.log(`[v0] Translation ${locale}: question=${!!hasQuestion}, answer=${!!hasAnswer}`)
          return hasQuestion && hasAnswer
        })
        .map(([locale, translation]: [string, any]) => ({
          faq_id: faq.id,
          locale,
          question: translation.question.trim(),
          answer: translation.answer.trim(),
        }))

      console.log("[v0] Prepared", translationInserts.length, "translation inserts")

      if (translationInserts.length > 0) {
        console.log("[v0] Inserting translations:", translationInserts)
        const { error: translationError } = await supabase.from("service_faq_translations").insert(translationInserts)

        if (translationError) {
          console.error("[v0] Error creating FAQ translations:", translationError)
          // Видаляємо створений FAQ якщо переклади не вдалося створити
          await supabase.from("service_faqs").delete().eq("id", faq.id)
          return NextResponse.json({ error: "Failed to create FAQ translations", details: translationError.message }, { status: 500 })
        }

        console.log("[v0] Translations inserted successfully")
      } else {
        console.warn("[v0] No valid translations to insert")
      }
    } else {
      console.log("[v0] No translations provided")
    }

    console.log("[v0] FAQ created successfully:", faq.id)
    return NextResponse.json({ faq }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in FAQ POST:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
