import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string; faqId: string } }) {
  try {
    const supabase = createServerClient()
    const { faqId } = params

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
    const { faqId } = params
    const body = await request.json()
    const { position, translations } = body

    console.log("[v0] Updating FAQ:", { faqId, position, translationsType: typeof translations, isArray: Array.isArray(translations) })

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

    // Оновлюємо FAQ
    const { error: faqError } = await supabase.from("service_faqs").update({ position }).eq("id", faqId)

    if (faqError) {
      console.error("[v0] Error updating FAQ:", faqError)
      return NextResponse.json({ error: "Failed to update FAQ", details: faqError.message }, { status: 500 })
    }

    console.log("[v0] FAQ record updated successfully")

    // Оновлюємо переклади
    if (translationEntries.length > 0) {
      // Видаляємо старі переклади
      console.log("[v0] Deleting old translations for faqId:", faqId)
      const { error: deleteError } = await supabase.from("service_faq_translations").delete().eq("service_faq_id", faqId)

      if (deleteError) {
        console.error("[v0] Error deleting old FAQ translations:", deleteError)
        return NextResponse.json({ error: "Failed to delete old translations", details: deleteError.message }, { status: 500 })
      }

      console.log("[v0] Old translations deleted")

      // Додаємо нові переклади
      const translationInserts = translationEntries
        .filter(([locale, translation]: [string, any]) => {
          const hasQuestion = translation?.question?.trim()
          const hasAnswer = translation?.answer?.trim()
          console.log(`[v0] Translation ${locale}: question=${!!hasQuestion}, answer=${!!hasAnswer}`)
          return hasQuestion && hasAnswer
        })
        .map(([locale, translation]: [string, any]) => ({
          service_faq_id: faqId,
          locale,
          question: translation.question.trim(),
          answer: translation.answer.trim(),
        }))

      console.log("[v0] Prepared", translationInserts.length, "translation inserts")

      if (translationInserts.length > 0) {
        console.log("[v0] Inserting translations:", translationInserts)
        const { error: insertError } = await supabase.from("service_faq_translations").insert(translationInserts)

        if (insertError) {
          console.error("[v0] Error inserting FAQ translations:", insertError)
          return NextResponse.json({ error: "Failed to insert translations", details: insertError.message }, { status: 500 })
        }

        console.log("[v0] Translations inserted successfully")
      } else {
        console.warn("[v0] No valid translations to insert")
      }
    } else {
      console.log("[v0] No translations provided")
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
