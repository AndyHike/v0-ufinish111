import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { hash } from "@/lib/auth/utils"
import { z } from "zod"
import remonline from "@/lib/api/remonline"
import { clearUserSessionsByUserId } from "@/app/actions/session"

// This is the secret key that RemOnline will use to authenticate the webhook
// You should set this in your environment variables and configure it in RemOnline
const WEBHOOK_SECRET = process.env.REMONLINE_WEBHOOK_SECRET || "your-webhook-secret"

// Define a schema for the RemOnline client data
const remonlineClientSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.array(z.string()).optional(),
  address: z.string().optional(),
})

// Define a schema for the RemOnline webhook payload
const remonlineWebhookSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  event_name: z.string(),
  context: z.object({
    object_id: z.number(),
    object_type: z.string(),
  }),
  employee: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // Зберегти оригінальний запит для логування
    const clonedRequest = request.clone()
    const payload = await clonedRequest.json()
    console.log("RemOnline webhook received:", payload)

    // Validate the webhook payload against the schema
    const parsedPayload = remonlineWebhookSchema.safeParse(payload)

    if (!parsedPayload.success) {
      console.error("Invalid webhook payload:", parsedPayload.error)
      return NextResponse.json(
        { error: "Invalid webhook payload", details: parsedPayload.error.errors },
        { status: 400 },
      )
    }

    // Verify the webhook signature if RemOnline provides one
    const signature = request.headers.get("x-remonline-signature")

    // If you have a signature verification mechanism, implement it here
    // if (!verifySignature(signature, await request.text(), WEBHOOK_SECRET)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    // }

    // Отримуємо оригінальні дані
    const originalRequest = parsedPayload.data
    console.log("RemOnline webhook data:", originalRequest)

    // Check the event type
    const eventType = originalRequest.event_name || ""

    if (eventType === "Client.Created" || eventType === "Client.Updated") {
      const clientId = originalRequest.context.object_id

      // Fetch complete client details from RemOnline API
      const clientDetails = await fetchClientDetailsFromRemonline(clientId)

      if (!clientDetails.success) {
        console.error("Failed to fetch client details from RemOnline:", clientDetails.message)
        return NextResponse.json(
          { error: "Failed to fetch client details from RemOnline", details: clientDetails.message },
          { status: 500 },
        )
      }

      // Check if clientDetails.client exists before parsing
      if (!clientDetails.client) {
        console.error("Client details are undefined, skipping processing")
        return NextResponse.json({ success: true, message: "Client details are undefined, skipping processing" })
      }

      // Validate client data against the schema
      const clientData = remonlineClientSchema.safeParse(clientDetails.client)

      if (!clientData.success) {
        console.error("Invalid client data:", clientData.error)
        console.error("Client Data that failed validation:", clientDetails.client)
        return NextResponse.json({ error: "Invalid client data", details: clientData.error.errors }, { status: 400 })
      }

      await handleClientEvent(clientData.data)
      return NextResponse.json({ success: true })
    }

    // Handle other event types as needed

    return NextResponse.json({ success: true, message: "Webhook received but no action taken" })
  } catch (error) {
    console.error("Error processing RemOnline webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function fetchClientDetailsFromRemonline(clientId: number) {
  try {
    // Authenticate with RemOnline API using our updated client
    const authResult = await remonline.auth()
    if (!authResult.success) {
      console.error("Failed to authenticate with RemOnline API:", authResult.message)
      return {
        success: false,
        message: "Failed to connect to RemOnline. Will retry later.",
      }
    }

    console.log(`Fetching client details for ID: ${clientId}`)

    // Use the token from our authenticated client
    const url = `https://api.remonline.app/clients/${clientId}?token=${authResult.token}`
    console.log("Request URL:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch client details with status ${response.status}: ${errorText}`)
      return {
        success: false,
        message: `Failed to fetch client details with status ${response.status}`,
        details: errorText,
      }
    }

    const responseText = await response.text()
    console.log("Response text length:", responseText.length)

    let data
    try {
      data = JSON.parse(responseText)
      console.log("Client details response:", data)
    } catch (e) {
      console.error("Failed to parse response as JSON:", responseText)
      return {
        success: false,
        message: "Failed to parse client details response",
        details: e instanceof Error ? e.message : String(e),
      }
    }

    return { success: true, client: data }
  } catch (error) {
    console.error("Error fetching client details from RemOnline:", error)
    return {
      success: false,
      message: "Failed to fetch client details from RemOnline API",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

async function handleClientEvent(clientData: any) {
  const supabase = createClient()

  if (!clientData.email) {
    console.error("Client from RemOnline has no email, cannot create or update user")
    return
  }

  try {
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", clientData.email.toLowerCase())
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Error checking existing user:", selectError)
      return
    }

    if (existingUser) {
      // Update existing user
      await updateExistingUser(supabase, existingUser.id, clientData)
    } else {
      // Create new user
      await createNewUser(supabase, clientData)
    }
  } catch (error) {
    console.error("Error in handleClientEvent:", error)
  }
}

// Змінюємо функцію createNewUser, щоб додавати email в обидві таблиці
async function createNewUser(supabase: any, clientData: any) {
  try {
    // Extract client data
    const email = clientData.email?.toLowerCase()
    const firstName = clientData.first_name || ""
    const lastName = clientData.last_name || ""
    const phone = clientData.phone && clientData.phone.length > 0 ? clientData.phone[0] : null
    const address = clientData.address || null

    if (!email) {
      console.error("Client from RemOnline has no email, cannot create user")
      return
    }

    // Generate a random password (user will use passwordless login anyway)
    const randomPassword = Math.random().toString(36).slice(-10)
    const passwordHash = await hash(randomPassword)

    // Create user in our database
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        email: email,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        password_hash: passwordHash,
        role: "user",
        remonline_id: clientData.id,
        email_verified: true, // Since it's coming from RemOnline, we can trust it
      })
      .select("id")
      .single()

    console.log("Supabase insert user data:", {
      email: email,
      name: `${firstName} ${lastName}`.trim(),
      password_hash: passwordHash,
      role: "user",
      remonline_id: clientData.id,
      email_verified: true,
    })

    if (userError) {
      console.error("Error creating user from RemOnline webhook:", userError)
      return
    }

    console.log("Supabase insert user result:", newUser)

    // Create profile with email and address
    const profileData = {
      id: newUser.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      email, // Обов'язково додаємо email в profiles
      address, // Додаємо address в profiles
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("profiles").insert([profileData])

    console.log("Supabase insert profile data:", profileData)

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Якщо не вдалося створити профіль, видаляємо користувача для збереження цілісності даних
      await supabase.from("users").delete().eq("id", newUser.id)
      console.error("Deleted user due to profile creation failure")
      return
    }

    console.log(`User created from RemOnline webhook: ${newUser.id}`)
  } catch (error) {
    console.error("Error in createNewUser:", error)
  }
}

// Змінюємо функцію updateExistingUser, щоб оновлювати email в обох таблицях
async function updateExistingUser(supabase: any, userId: string, clientData: any) {
  try {
    // Extract client data
    const email = clientData.email?.toLowerCase()
    const firstName = clientData.first_name || ""
    const lastName = clientData.last_name || ""
    const phone = clientData.phone && clientData.phone.length > 0 ? clientData.phone[0] : null
    const address = clientData.address || ""

    if (!email) {
      console.error("Client from RemOnline has no email, cannot update user")
      return
    }

    // Update user
    const { error: userError } = await supabase
      .from("users")
      .update({
        email, // Оновлюємо email в users
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`.trim(),
        remonline_id: clientData.id, // Оновлюємо remonline_id
      })
      .eq("id", userId)

    console.log("Supabase update user data:", {
      email,
      name: `${firstName} ${lastName}`.trim(),
      remonline_id: clientData.id,
    })

    if (userError) {
      console.error("Error updating user from RemOnline webhook:", userError)
      return
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        email, // Обов'язково оновлюємо email в profiles
        address, // Оновлюємо address в profiles
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    console.log("Supabase update profile data:", {
      name: `${firstName} ${lastName}`.trim(),
      phone,
      email,
      address,
    })

    if (profileError) {
      console.error("Error updating profile from RemOnline webhook:", profileError)
    }

    console.log(`User updated from RemOnline webhook: ${userId}`)

    // Clear all user sessions
    await clearUserSessionsByUserId(userId)
  } catch (error) {
    console.error("Error in updateExistingUser:", error)
  }
}
