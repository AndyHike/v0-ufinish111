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
        role_id,
        ico,
        dic,
        is_b2b,
        is_approved,
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
    const u = user as any
    const transformedUser = {
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      created_at: u.created_at,
      phone: u.profiles?.phone || null,
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
    const { first_name, last_name, email, role, phone, is_approved, role_id, ico, dic, is_b2b } = body

    const supabase = createClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (is_approved !== undefined) updateData.is_approved = is_approved
    if (role_id !== undefined) updateData.role_id = role_id
    if (ico !== undefined) updateData.ico = ico
    if (dic !== undefined) updateData.dic = dic
    if (is_b2b !== undefined) updateData.is_b2b = is_b2b

    // Update user in users table
    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
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
        role_id,
        ico,
        dic,
        is_b2b,
        is_approved,
        created_at,
        profiles!inner(phone)
      `)
      .eq("id", id)
      .single()

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to fetch updated user" }, { status: 500 })
    }

    const u = updatedUser as any
    const transformedUser = {
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      role_id: u.role_id,
      ico: u.ico,
      dic: u.dic,
      is_b2b: u.is_b2b,
      is_approved: u.is_approved,
      created_at: u.created_at,
      phone: u.profiles?.phone || null,
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
