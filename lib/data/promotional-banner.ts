import { createClient } from "@/utils/supabase/server"

export type PromotionalBannerData = {
  id: string
  is_active: boolean
  color: string
  text_cs: string
  text_en: string
  text_uk: string
  button_text_cs: string
  button_text_en: string
  button_text_uk: string
}

export async function getPromotionalBanner(): Promise<PromotionalBannerData | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("promotional_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching promotional banner:", error)
    return null
  }
}
