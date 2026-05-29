import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { logActivity } from "@/lib/admin/activity-logger"
import { sendAccountApprovedEmail } from "@/lib/email/send-email"

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
  if (!hasBillingAddress) return undefined

  const cityLine = [billing_postal_code, billing_city].filter(Boolean).join(" ")
  return [billing_street, cityLine, billing_country || "CZ"].filter(Boolean).join(", ")
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
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
        company_name,
        is_b2b,
        is_approved,
        created_at,
        profiles!inner(phone, billing_street, billing_city, billing_postal_code, billing_country)
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
      role_id: u.role_id,
      ico: u.ico,
      dic: u.dic,
      company_name: u.company_name,
      is_b2b: u.is_b2b,
      is_approved: u.is_approved,
      created_at: u.created_at,
      phone: u.profiles?.phone || null,
      billing_street: u.profiles?.billing_street || null,
      billing_city: u.profiles?.billing_city || null,
      billing_postal_code: u.profiles?.billing_postal_code || null,
      billing_country: u.profiles?.billing_country || null,
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      role,
      phone,
      is_approved,
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
    const normalizedCompanyName = companyName ?? company_name
    const normalizedBilling = {
      billing_street: billingStreet ?? billing_street,
      billing_city: billingCity ?? billing_city,
      billing_postal_code: billingPostalCode ?? billing_postal_code,
      billing_country: billingCountry ?? billing_country,
    }

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
    if (normalizedCompanyName !== undefined) updateData.company_name = normalizedCompanyName

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

    // Send approval email if user was just approved
    if (is_approved === true && user) {
      // Check if user was previously not approved (prevent re-sending on other edits)
      // Since we just set is_approved=true and got the updated user, we send the email
      // We determine locale from the Accept-Language header or default to 'cs'
      const acceptLang = request.headers.get("accept-language") || ""
      const locale = acceptLang.includes("uk") ? "uk" : acceptLang.includes("en") ? "en" : "cs"

      sendAccountApprovedEmail(user.email, locale).catch((err) => {
        console.error("Failed to send approval email:", err)
      })
    }

    // Update phone and billing fields in profiles table
    const shouldUpdateProfile =
      phone !== undefined ||
      first_name !== undefined ||
      last_name !== undefined ||
      normalizedBilling.billing_street !== undefined ||
      normalizedBilling.billing_city !== undefined ||
      normalizedBilling.billing_postal_code !== undefined ||
      normalizedBilling.billing_country !== undefined

    if (shouldUpdateProfile) {
      const profileUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }
      if (phone !== undefined) profileUpdate.phone = phone
      if (first_name !== undefined) profileUpdate.first_name = first_name
      if (last_name !== undefined) profileUpdate.last_name = last_name
      if (normalizedBilling.billing_street !== undefined) profileUpdate.billing_street = normalizedBilling.billing_street
      if (normalizedBilling.billing_city !== undefined) profileUpdate.billing_city = normalizedBilling.billing_city
      if (normalizedBilling.billing_postal_code !== undefined) {
        profileUpdate.billing_postal_code = normalizedBilling.billing_postal_code
      }
      if (normalizedBilling.billing_country !== undefined) profileUpdate.billing_country = normalizedBilling.billing_country || "CZ"
      const billingAddress = buildBillingAddress({
        billing_street: profileUpdate.billing_street,
        billing_city: profileUpdate.billing_city,
        billing_postal_code: profileUpdate.billing_postal_code,
        billing_country: profileUpdate.billing_country,
      })
      if (billingAddress !== undefined) profileUpdate.address = billingAddress

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
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
        company_name,
        is_b2b,
        is_approved,
        created_at,
        profiles!inner(phone, billing_street, billing_city, billing_postal_code, billing_country)
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
      company_name: u.company_name,
      is_b2b: u.is_b2b,
      is_approved: u.is_approved,
      created_at: u.created_at,
      phone: u.profiles?.phone || null,
      billing_street: u.profiles?.billing_street || null,
      billing_city: u.profiles?.billing_city || null,
      billing_postal_code: u.profiles?.billing_postal_code || null,
      billing_country: u.profiles?.billing_country || null,
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id
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
