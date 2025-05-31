import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { formatPhone } from "@/utils/format-phone"

// Schema for client search
const SearchSchema = z.object({
  term: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
})

const REMONLINE_API_URL = "https://api.remonline.app"

// Function to get authentication token
async function getRemonlineToken() {
  const response = await fetch(`${REMONLINE_API_URL}/token/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.REMONLINE_API_TOKEN,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.statusText}`)
  }

  const data = await response.json()
  return data.token
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const searchParams = SearchSchema.parse(body)

    // Get token
    const token = await getRemonlineToken()

    // Build search query
    const searchQuery = new URLSearchParams()
    searchQuery.append("token", token)

    if (searchParams.term) {
      searchQuery.append("query", searchParams.term)
    }

    if (searchParams.email) {
      searchQuery.append("email", searchParams.email)
    }

    if (searchParams.phone) {
      searchQuery.append("phone", searchParams.phone)
    }

    searchQuery.append("page", searchParams.page.toString())
    searchQuery.append("limit", searchParams.limit.toString())

    // Fetch clients from Remonline
    const response = await fetch(`${REMONLINE_API_URL}/clients?${searchQuery.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`)
    }

    const clientsData = await response.json()

    // Process clients and sync to database
    for (const client of clientsData.data) {
      if (!client.email && !client.phone) continue

      const formattedPhone = client.phone ? formatPhone(client.phone) : null

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

        if (client.name) profileUpdate.name = client.name
        if (formattedPhone) profileUpdate.phone = formattedPhone
        if (client.address) profileUpdate.address = client.address

        await supabase.from("profiles").update(profileUpdate).eq("id", userId)
      } else {
        // Create new user with transaction to ensure both tables are updated
        // Змінюємо функцію для створення нового користувача, щоб додавати email в обидві таблиці
        // Create new user
        const userData = {
          email: client.email || `${formattedPhone?.replace(/\D/g, "")}@placeholder.com`,
          name: client.name || "Customer",
          phone: formattedPhone,
          address: client.address,
          id: client.id,
        }

        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({
            email: userData.email.toLowerCase(),
            role: "customer",
            remonline_id: userData.id,
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
          name: userData.name,
          phone: userData.phone,
          email: userData.email.toLowerCase(), // Додаємо email в profiles
          address: userData.address || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Failed to create profile:", profileError)
          // Видаляємо користувача, якщо не вдалося створити профіль
          await supabase.from("users").delete().eq("id", newUser.id)
          console.error(`Failed to create profile for "${userData.email}": ${profileError.message}`)
          continue
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      total: clientsData.count,
      processed: clientsData.data.length,
    })
  } catch (error) {
    console.error("Sync error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync with Remonline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
