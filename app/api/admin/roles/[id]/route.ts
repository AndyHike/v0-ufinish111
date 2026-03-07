import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient()

        const { data: role, error } = await supabase
            .from("roles")
            .select("*")
            .eq("id", params.id)
            .single()

        if (error || !role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 })
        }

        return NextResponse.json(role)
    } catch (error) {
        console.error("Error fetching role:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const { name, slug, is_default, auto_approve, discount_percentage, description } = body

        const supabase = createClient()

        // If this role is being set as default, unset the current default
        if (is_default) {
            await supabase
                .from("roles")
                .update({ is_default: false })
                .neq("id", params.id)
        }

        const { data: role, error } = await supabase
            .from("roles")
            .update({
                name,
                slug: slug?.toLowerCase().replace(/\s+/g, "-"),
                is_default: is_default ?? false,
                auto_approve: auto_approve ?? true,
                discount_percentage: discount_percentage ?? 0,
                description: description || null,
            })
            .eq("id", params.id)
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
                { error: "Failed to update role", details: error.message },
                { status: 500 },
            )
        }

        await logActivity({
            action: "update",
            entity: "role",
            entityId: params.id,
            details: `Updated role: ${name}`,
        })

        return NextResponse.json(role)
    } catch (error) {
        console.error("Error updating role:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient()

        // Check if role is default
        const { data: role } = await supabase
            .from("roles")
            .select("name, slug, is_default")
            .eq("id", params.id)
            .single()

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 })
        }

        if (role.is_default) {
            return NextResponse.json(
                { error: "Cannot delete the default role" },
                { status: 400 },
            )
        }

        // Check if any users have this role
        const { count } = await supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .eq("role_id", params.id)

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Cannot delete role: ${count} user(s) are assigned to it` },
                { status: 400 },
            )
        }

        const { error } = await supabase
            .from("roles")
            .delete()
            .eq("id", params.id)

        if (error) {
            return NextResponse.json(
                { error: "Failed to delete role", details: error.message },
                { status: 500 },
            )
        }

        await logActivity({
            action: "delete",
            entity: "role",
            entityId: params.id,
            details: `Deleted role: ${role.name} (${role.slug})`,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting role:", error)
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
    }
}
