import { createClient } from "@/utils/supabase/server"
import { CarouselData } from "@/types/hero-carousel"

export async function getHeroCarouselData(): Promise<CarouselData | null> {
    try {
        const supabase = await createClient()

        const { data: settings } = await supabase
            .from("hero_carousel_settings")
            .select("*")
            .limit(1)
            .maybeSingle()

        if (!settings?.enabled) {
            return null
        }

        const { data: slides } = await supabase
            .from("hero_carousel_slides")
            .select("*")
            .order("sort_order", { ascending: true })

        return {
            enabled: settings.enabled,
            autoplay_interval: settings.autoplay_interval,
            slides: slides || [],
        }
    } catch (error) {
        console.error("Failed to fetch server-side carousel data:", error)
        return null
    }
}
