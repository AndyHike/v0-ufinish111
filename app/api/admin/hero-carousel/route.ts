export const dynamic = "force-dynamic"

import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// GET: Fetch carousel settings + slides
export async function GET() {
    try {
        const supabase = await createClient()

        // Get settings
        const { data: settings, error: settingsError } = await supabase
            .from("hero_carousel_settings")
            .select("*")
            .limit(1)
            .maybeSingle()

        if (settingsError) {
            console.error("[hero-carousel] Settings fetch error:", settingsError)
            throw settingsError
        }

        // Get slides
        const { data: slides, error: slidesError } = await supabase
            .from("hero_carousel_slides")
            .select("*")
            .order("sort_order", { ascending: true })

        if (slidesError) {
            console.error("[hero-carousel] Slides fetch error:", slidesError)
            throw slidesError
        }

        return NextResponse.json({
            settings: settings || { enabled: false, autoplay_interval: 5000 },
            slides: slides || [],
        })
    } catch (error) {
        console.error("[hero-carousel] Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch hero carousel data" },
            { status: 500 }
        )
    }
}

// POST: Update settings
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        // Check if settings exist
        const { data: existing } = await supabase
            .from("hero_carousel_settings")
            .select("id")
            .limit(1)
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from("hero_carousel_settings")
                .update({
                    enabled: body.enabled,
                    autoplay_interval: body.autoplay_interval || 5000,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id)

            if (error) throw error
        } else {
            const { error } = await supabase
                .from("hero_carousel_settings")
                .insert([{
                    enabled: body.enabled,
                    autoplay_interval: body.autoplay_interval || 5000,
                }])

            if (error) throw error
        }

        revalidatePath("/")
        revalidatePath("/[locale]", "page")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[hero-carousel] Settings save error:", error)
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        )
    }
}

// PUT: Add or update a slide
export async function PUT(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        if (body.id) {
            // Update existing slide
            const { error } = await supabase
                .from("hero_carousel_slides")
                .update({
                    image_url: body.image_url,
                    link: body.link,
                    sort_order: body.sort_order,
                })
                .eq("id", body.id)

            if (error) throw error
        } else {
            // Create new slide
            const { error } = await supabase
                .from("hero_carousel_slides")
                .insert([{
                    image_url: body.image_url,
                    link: body.link,
                    sort_order: body.sort_order || 0,
                }])

            if (error) throw error
        }

        revalidatePath("/")
        revalidatePath("/[locale]", "page")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[hero-carousel] Slide save error:", error)
        return NextResponse.json(
            { error: "Failed to save slide" },
            { status: 500 }
        )
    }
}

// DELETE: Remove a slide
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Slide ID required" }, { status: 400 })
        }

        const { error } = await supabase
            .from("hero_carousel_slides")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/")
        revalidatePath("/[locale]", "page")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[hero-carousel] Slide delete error:", error)
        return NextResponse.json(
            { error: "Failed to delete slide" },
            { status: 500 }
        )
    }
}
