import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"
import { logActivity } from "@/lib/admin/activity-logger"
import { syncUserToRemonline } from "@/lib/services/remonline-sync"

function buildBillingAddress({
  billing_street,
  billing_city,
  billing_postal_code,
  billing_country,
}: {
  billing_street?: string
  billing_city?: string
  billing_postal_code?: string
  billing_country?: string
}) {
  const hasBillingAddress = Boolean(billing_street || billing_city || billing_postal_code)
  if (!hasBillingAddress) return null

  const cityLine = [billing_postal_code, billing_city].filter(Boolean).join(" ")
  return [billing_street, cityLine, billing_country || "CZ"].filter(Boolean).join(", ")
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function sanitizePostgrestSearch(value: string) {
  return value.replace(/[%,()]/g, " ").trim()
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")?.trim() || ""
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
        role_id,
        ico,
        dic,
        company_name,
        is_b2b,
        is_approved,
        remonline_id,
        remonline_contact_type,
        remonline_sync_status,
        remonline_sync_error,
        remonline_synced_at,
        remonline_sync_attempts,
        created_at, 
        updated_at,
        profiles!left(phone, avatar_url, billing_street, billing_city, billing_postal_code, billing_country),
        roles!left(name, slug, discount_percentage)
      `,
      { count: "exact" },
    )

    // Apply search filter if query is provided
    if (query) {
      const safeQuery = sanitizePostgrestSearch(query)
      const phoneProfiles = await supabase.from("profiles").select("id").ilike("phone", `%${query}%`).limit(50)
      const profileUserIds = (phoneProfiles.data || []).map((profile) => profile.id).filter(Boolean)
      const filters = [
        `email.ilike.%${safeQuery}%`,
        `first_name.ilike.%${safeQuery}%`,
        `last_name.ilike.%${safeQuery}%`,
        `company_name.ilike.%${safeQuery}%`,
        `ico.ilike.%${safeQuery}%`,
      ]

      if (isUuid(query)) {
        filters.push(`id.eq.${query}`)
      }

      for (const userId of profileUserIds) {
        filters.push(`id.eq.${userId}`)
      }

      supabaseQuery = supabaseQuery.or(filters.join(","))
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
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || null,
      role: user.role,
      role_id: user.role_id,
      role_name: user.roles?.name || null,
      ico: user.ico,
      dic: user.dic,
      company_name: user.company_name,
      is_b2b: user.is_b2b || false,
      is_approved: user.is_approved ?? true,
      remonline_id: user.remonline_id || null,
      remonline_contact_type: user.remonline_contact_type || null,
      remonline_sync_status: user.remonline_sync_status || null,
      remonline_sync_error: user.remonline_sync_error || null,
      remonline_synced_at: user.remonline_synced_at || null,
      remonline_sync_attempts: user.remonline_sync_attempts ?? null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      phone: user.profiles?.phone || null,
      avatar_url: user.profiles?.avatar_url || null,
      billing_street: user.profiles?.billing_street || null,
      billing_city: user.profiles?.billing_city || null,
      billing_postal_code: user.profiles?.billing_postal_code || null,
      billing_country: user.profiles?.billing_country || null,
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
    const session = await getSession()
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      role,
      phone,
      password,
      role_id,
      ico,
      dic,
      is_b2b,
      company_name,
      companyName,
      billing_street,
      billingStreet,
      billing_city,
      billingCity,
      billing_postal_code,
      billingPostalCode,
      billing_country,
      billingCountry,
    } = body
    const normalizedCompanyName = companyName || company_name || null
    const normalizedBilling = {
      billing_street: billingStreet || billing_street || null,
      billing_city: billingCity || billing_city || null,
      billing_postal_code: billingPostalCode || billing_postal_code || null,
      billing_country: billingCountry || billing_country || "CZ",
    }

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
        role: role || "user",
        role_id: role_id || null,
        ico: ico || null,
        dic: dic || null,
        company_name: normalizedCompanyName,
        is_b2b: is_b2b || false,
        is_approved: true,
        remonline_sync_status: "pending",
        remonline_sync_attempts: 0,
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
      address: buildBillingAddress(normalizedBilling),
      billing_street: normalizedBilling.billing_street,
      billing_city: normalizedBilling.billing_city,
      billing_postal_code: normalizedBilling.billing_postal_code,
      billing_country: normalizedBilling.billing_country,
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

    syncUserToRemonline(authUser.user.id).catch((error) => {
      console.error("Failed to sync admin-created user to RemOnline:", error)
    })

    return NextResponse.json({
      id: authUser.user.id,
      email,
      first_name,
      last_name,
      role,
      phone,
      company_name: normalizedCompanyName,
      billing_street: normalizedBilling.billing_street,
      billing_city: normalizedBilling.billing_city,
      billing_postal_code: normalizedBilling.billing_postal_code,
      billing_country: normalizedBilling.billing_country,
      remonline_sync_status: "pending",
      remonline_sync_attempts: 0,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
