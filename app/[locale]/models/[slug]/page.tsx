import type { Metadata } from "next"
import { createServerClient } from "@/utils/supabase/server"
import ModelClientPage from "./ModelClientPage"

type Props = {
  params: {
    locale: string
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = params

  const supabase = createServerClient()

  // Спочатку спробуємо знайти за слагом
  let { data: model } = await supabase.from("models").select("*, brands(name)").eq("slug", slug).single()

  // Якщо не знайдено за слагом, спробуємо знайти за ID
  if (!model) {
    const { data } = await supabase.from("models").select("*, brands(name)").eq("id", slug).single()
    model = data
  }

  if (!model) {
    const titlePatterns = {
      cs: "Model nenalezen | DeviceHelp",
      en: "Model not found | DeviceHelp",
      uk: "Модель не знайдено | DeviceHelp",
    }

    const descriptionPatterns = {
      cs: "Požadovaný model zařízení nebyl nalezen.",
      en: "The requested device model could not be found.",
      uk: "Запитувану модель пристрою не вдалося знайти.",
    }

    return {
      title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
      description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
    }
  }

  const titlePatterns = {
    cs: `Oprava ${model.name} ${model.brands?.name} | DeviceHelp`,
    en: `${model.name} ${model.brands?.name} repair | DeviceHelp`,
    uk: `Ремонт ${model.name} ${model.brands?.name} | DeviceHelp`,
  }

  const descriptionPatterns = {
    cs: `Profesionální oprava ${model.name} od ${model.brands?.name}. Rychlé a kvalitní služby s garancí. Rezervujte si termín online.`,
    en: `Professional ${model.name} repair from ${model.brands?.name}. Fast and quality services with warranty. Book your appointment online.`,
    uk: `Професійний ремонт ${model.name} від ${model.brands?.name}. Швидкі та якісні послуги з гарантією. Забронюйте зустріч онлайн.`,
  }

  return {
    title: titlePatterns[locale as keyof typeof titlePatterns] || titlePatterns.en,
    description: descriptionPatterns[locale as keyof typeof descriptionPatterns] || descriptionPatterns.en,
  }
}

export default async function ModelPage({ params }: Props) {
  return <ModelClientPage params={params} />
}
