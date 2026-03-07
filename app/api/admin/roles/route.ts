import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET() {
    try {
        const supabase = createClient()

        const { data: roles, error } = await supabase
            .from("roles")
            .select("*")
            .order("created_at", { ascending: true })

        if (error) {
            return NextResponse.json(
                { error: "Failed to fetch roles", details: error.message },
                { status: 500 },
            )
        }

        return NextResponse.json(roles || [])
    } catch (error) {
        console.error("Error fetching roles:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, slug, is_default, auto_approve, discount_percentage, description } = body

        if (!name || !slug) {
            return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
        }

        const supabase = createClient()

        // If this role is being set as default, unset the current default
        if (is_default) {
            await supabase
                .from("roles")
                .update({ is_default: false })
                .eq("is_default", true)
        }

        const { data: role, error } = await supabase
            .from("roles")
            .insert({
                name,
                slug: slug.toLowerCase().replace(/\s+/g, "-"),
                is_default: is_default || false,
                auto_approve: auto_approve ?? true,
                discount_percentage: discount_percentage || 0,
                description: description || null,
            })
            .select()
            .single()

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: "Role with this slug already exists" },
                    { status: 400 },
                )
            }
            return NextResponse.json(
                { error: "Failed to create role", details: error.message },
                { status: 500 },
            )
        }

        await logActivity({
            action: "create",
            entity: "role",
            entityId: role.id,
            details: `Created role: ${name} (${slug})`,
        })

        return NextResponse.json(role)
    } catch (error) {
        console.error("Error creating role:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}
