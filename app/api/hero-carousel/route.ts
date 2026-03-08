export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ enabled: false, slides: [] })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get settings
        const { data: settings } = await supabase
            .from("hero_carousel_settings")
            .select("*")
            .limit(1)
            .maybeSingle()

        if (!settings || !settings.enabled) {
            return NextResponse.json({ enabled: false, slides: [] })
        }

        // Get slides
        const { data: slides } = await supabase
            .from("hero_carousel_slides")
            .select("*")
            .order("sort_order", { ascending: true })

        return NextResponse.json({
            enabled: true,
            autoplay_interval: settings.autoplay_interval || 5000,
            slides: slides || [],
        })
    } catch (error) {
        console.error("Error fetching hero carousel:", error)
        return NextResponse.json({ enabled: false, slides: [] })
    }
}
