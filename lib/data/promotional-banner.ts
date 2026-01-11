import { createClient } from "@/utils/supabase/server"

export type PromotionalBannerData = {
  id: string
  enabled: boolean
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
      .eq("enabled", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No enabled banner found
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching promotional banner:", error)
    return null
  }
}
