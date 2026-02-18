import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { formatPhone } from "@/utils/format-phone"
import remonline from "@/lib/api/remonline"

// Schema for client search
const SearchSchema = z.object({
  term: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const searchParams = SearchSchema.parse(body)

    console.log("Starting RemOnline sync with params:", searchParams)

    // Test API connection first
    const connectionTest = await remonline.testConnection()
    if (!connectionTest.success) {
      console.error("RemOnline API connection test failed:", connectionTest.message)
      return NextResponse.json(
        {
          error: "Failed to connect to RemOnline API",
          details: connectionTest.message,
        },
        { status: 500 },
      )
    }

    console.log("RemOnline API connection successful")

    // Build search parameters
    const apiParams: any = {
      page: searchParams.page,
      limit: searchParams.limit,
    }

    if (searchParams.term) {
      apiParams.query = searchParams.term
    }

    if (searchParams.email) {
      apiParams.email = searchParams.email
    }

    if (searchParams.phone) {
      apiParams.phone = searchParams.phone
    }

    // Fetch clients from RemOnline using new API
    const clientsResponse = await remonline.getClients(apiParams)

    if (!clientsResponse.success) {
      console.error("Failed to fetch clients from RemOnline:", clientsResponse.message)
      return NextResponse.json(
        {
          error: "Failed to fetch clients from RemOnline",
          details: clientsResponse.message,
        },
        { status: 500 },
      )
    }

    const clientsData = clientsResponse.data

    console.log(`Fetched ${clientsData.data?.length || 0} clients from RemOnline`)

    // Process clients and sync to database
    let processedCount = 0
    for (const client of clientsData.data || []) {
      if (!client.email && !client.phone) {
        console.log(`Skipping client ${client.id} - no email or phone`)
        continue
      }

      const formattedPhone = client.phone && client.phone.length > 0 ? formatPhone(client.phone[0]) : null

      // Check if user exists
      let existingUser = null

      if (client.email) {
        const { data: userByEmail } = await supabase
          .from("users")
          .select("id")
          .eq("email", client.email.toLowerCase())
          .single()

        if (userByEmail) existingUser = userByEmail
      }

      if (!existingUser && formattedPhone) {
        const { data: profileByPhone } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", formattedPhone)
          .single()

        if (profileByPhone) {
          const { data: userById } = await supabase.from("users").select("id").eq("id", profileByPhone.id).single()

          if (userById) existingUser = userById
        }
      }

      if (existingUser) {
        // Update existing user
        const userId = existingUser.id

        // Update users table if email is provided
        if (client.email) {
          await supabase
            .from("users")
            .update({
              email: client.email.toLowerCase(),
              remonline_id: client.id,
            })
            .eq("id", userId)
        }

        // Update profiles table
        const profileUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        }

        if (client.first_name || client.last_name) {
          profileUpdate.first_name = client.first_name || ""
          profileUpdate.last_name = client.last_name || ""
        }
        if (formattedPhone) profileUpdate.phone = formattedPhone
        if (client.address) profileUpdate.address = client.address
        if (client.email) profileUpdate.email = client.email.toLowerCase()

        await supabase.from("profiles").update(profileUpdate).eq("id", userId)

        console.log(`Updated existing user ${userId} for RemOnline client ${client.id}`)
      } else {
        // Create new user
        const userData = {
          email: client.email || `${formattedPhone?.replace(/\D/g, "")}@placeholder.com`,
          first_name: client.first_name || "",
          last_name: client.last_name || "",
          name: `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Customer",
          phone: formattedPhone,
          address: client.address,
          remonline_id: client.id,
        }

        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({
            email: userData.email.toLowerCase(),
            first_name: userData.first_name,
            last_name: userData.last_name,
            name: userData.name,
            role: "customer",
            remonline_id: userData.remonline_id,
          })
          .select("id")
          .single()

        if (userError) {
          console.error(`Failed to create user "${userData.email}": ${userError.message}`)
          continue
        }

        // Create profile with email
        const { error: profileError } = await supabase.from("profiles").insert({
          id: newUser.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          email: userData.email.toLowerCase(), // Add email to profiles
          address: userData.address || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Failed to create profile:", profileError)
          // Delete user if profile creation failed
          await supabase.from("users").delete().eq("id", newUser.id)
          console.error(`Failed to create profile for "${userData.email}": ${profileError.message}`)
          continue
        }

        console.log(`Created new user ${newUser.id} for RemOnline client ${client.id}`)
      }

      processedCount++
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      total: clientsData.count || 0,
      processed: processedCount,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync with RemOnline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
