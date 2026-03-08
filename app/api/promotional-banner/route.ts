export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(null)
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase
            .from("promotional_banners")
            .select("*")
            .eq("enabled", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (error) {
            console.error("Error fetching promotional banner:", error)
            return NextResponse.json(null)
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error fetching promotional banner:", error)
        return NextResponse.json(null)
    }
}
