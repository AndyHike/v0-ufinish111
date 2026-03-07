import { createClient } from "@supabase/supabase-js"

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
    // For SSG compatibility, we use the standard supabase-js client
    // instead of the Next.js server component client which opts into dynamic rendering
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseKey) return null

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("promotional_banners")
      .select("*")
      .eq("enabled", true)
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
