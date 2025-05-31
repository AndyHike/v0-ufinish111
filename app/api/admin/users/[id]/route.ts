import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const supabase = createClient()

    // Join with profiles to get phone
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        created_at,
        profiles!inner(phone)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch user",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Transform to flatten the structure
    const transformedUser = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
      phone: user.profiles?.phone || null,
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const { first_name, last_name, email, role, phone } = body

    const supabase = createClient()

    // Update user in users table (without phone)
    const { data: user, error } = await supabase
      .from("users")
      .update({
        first_name,
        last_name,
        email,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to update user",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Update phone in profiles table
    if (phone !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone,
          first_name,
          last_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (profileError) {
        return NextResponse.json(
          {
            error: "Failed to update user profile",
            details: profileError.message,
          },
          { status: 500 },
        )
      }
    }

    // Log activity
    await logActivity({
      action: "update",
      entity: "user",
      entityId: id,
      details: `Updated user: ${email}`,
    })

    // Return updated user with phone
    const { data: updatedUser } = await supabase
      .from("users")
      .select(`
        id, 
        email, 
        first_name, 
        last_name, 
        role, 
        created_at,
        profiles!inner(phone)
      `)
      .eq("id", id)
      .single()

    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      phone: updatedUser.profiles?.phone || null,
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const supabase = createClient()

    // Get user email before deletion for activity log
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        {
          error: "Failed to fetch user",
          details: fetchError.message,
        },
        { status: 500 },
      )
    }

    // Delete user
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to delete user",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Log activity
    const userName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : ""
    const userIdentifier = userName || user?.email || id

    await logActivity({
      action: "delete",
      entity: "user",
      entityId: id,
      details: `Deleted user: ${userIdentifier}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
