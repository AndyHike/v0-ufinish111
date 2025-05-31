import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const role = searchParams.get("role") || undefined
    const status = searchParams.get("status") || undefined
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = createClient()

    // Start building the query
    let supabaseQuery = supabase.from("users").select(
      `
        id, 
        email, 
        first_name,
        last_name,
        role, 
        created_at, 
        updated_at,
        profiles!left(phone, avatar_url)
      `,
      { count: "exact" },
    )

    // Apply search filter if query is provided
    if (query) {
      supabaseQuery = supabaseQuery.or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }

    // Apply role filter if provided
    if (role) {
      supabaseQuery = supabaseQuery.eq("role", role)
    }

    // Apply pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    // Execute the query
    const { data: users, error, count } = await supabaseQuery

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fetch users",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Transform the data to flatten the structure
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || null,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      phone: user.profiles?.phone || null,
      avatar_url: user.profiles?.avatar_url || null,
    }))

    return NextResponse.json({
      users: transformedUsers,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, first_name, last_name, role, phone, password } = body

    const supabase = createClient()

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json(
        {
          error: "Failed to create user in auth system",
          details: authError.message,
        },
        { status: 500 },
      )
    }

    // Create user in public.users
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        role,
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json(
        {
          error: "Failed to create user record",
          details: userError.message,
        },
        { status: 500 },
      )
    }

    // Create profile for the user
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authUser.user.id,
      first_name,
      last_name,
      phone,
    })

    if (profileError) {
      return NextResponse.json(
        {
          error: "Failed to create user profile",
          details: profileError.message,
        },
        { status: 500 },
      )
    }

    // Log activity
    await logActivity({
      action: "create",
      entity: "user",
      entityId: authUser.user.id,
      details: `Created user: ${email}`,
    })

    return NextResponse.json({
      id: authUser.user.id,
      email,
      first_name,
      last_name,
      role,
      phone,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
