import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { formatPhone } from "@/utils/format-phone"

// Schema for validating webhook payload
const WebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    // Add any other fields that might come from Remonline
  }),
  secret: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate webhook secret to ensure it's from Remonline
    if (body.secret !== process.env.REMONLINE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 })
    }

    const validatedData = WebhookSchema.parse(body)
    const { event, data } = validatedData

    // Handle different event types
    if (event === "client_created" || event === "client_updated") {
      // Skip if no email or phone is provided
      if (!data.email && !data.phone) {
        return NextResponse.json(
          {
            error: "Email or phone is required for user creation",
          },
          { status: 400 },
        )
      }

      const formattedPhone = data.phone ? formatPhone(data.phone) : null

      // Check if user already exists by email or phone
      let existingUser = null

      if (data.email) {
        const { data: userByEmail } = await supabase
          .from("users")
          .select("id")
          .eq("email", data.email.toLowerCase())
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
        if (data.email) {
          await supabase
            .from("users")
            .update({
              email: data.email.toLowerCase(),
              remonline_id: data.id,
            })
            .eq("id", userId)
        }

        // Update profiles table
        const profileUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        }

        if (data.name) profileUpdate.name = data.name
        if (formattedPhone) profileUpdate.phone = formattedPhone
        if (data.address) profileUpdate.address = data.address

        await supabase.from("profiles").update(profileUpdate).eq("id", userId)

        return NextResponse.json({
          success: true,
          message: "User updated successfully",
          userId,
        })
      } else {
        // Create new user with transaction to ensure both tables are updated
        const userId = uuidv4()

        // Start with users table
        if (data.email) {
          // Змінюємо функцію для створення нового користувача, щоб додавати email в обидві таблиці
          // Create new user
          const { data: userData, error: userError } = await supabase
            .from("users")
            .insert([
              {
                email: data.email.toLowerCase(),
                role: "customer",
                remonline_id: data.id,
              },
            ])
            .select("id")
            .single()

          if (userError) {
            console.error("Error creating user:", userError)
            return NextResponse.json(
              {
                error: "Failed to create user account",
                details: userError.message,
              },
              { status: 500 },
            )
          }

          // Then create profile
          const { error: profileError } = await supabase.from("profiles").insert({
            id: userData.id,
            name: data.name || "Customer",
            phone: formattedPhone,
            email: data.email.toLowerCase(), // Додаємо email в profiles
            address: data.address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (profileError) {
            console.error("Error creating profile:", profileError)

            // Rollback user creation if profile creation fails
            await supabase.from("users").delete().eq("id", userData.id)

            return NextResponse.json(
              {
                error: "Failed to create user profile",
                details: profileError.message,
              },
              { status: 500 },
            )
          }

          return NextResponse.json({
            success: true,
            message: "User created successfully",
            userId: userData.id,
          })
        } else {
          // If no email, create a dummy email based on phone
          const dummyEmail = `${formattedPhone?.replace(/\D/g, "")}@placeholder.com`

          const { error: userError } = await supabase.from("users").insert({
            id: userId,
            email: dummyEmail,
            role: "customer",
            remonline_id: data.id,
          })

          if (userError) {
            console.error("Error creating user with dummy email:", userError)
            return NextResponse.json(
              {
                error: "Failed to create user account",
                details: userError.message,
              },
              { status: 500 },
            )
          }
        }

        // Then create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userId,
          name: data.name || "Customer",
          phone: formattedPhone,
          address: data.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)

          // Rollback user creation if profile creation fails
          await supabase.from("users").delete().eq("id", userId)

          return NextResponse.json(
            {
              error: "Failed to create user profile",
              details: profileError.message,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "User created successfully",
          userId,
        })
      }
    } else if (event === "client_deleted") {
      // Handle client deletion if needed
      const { data: user } = await supabase.from("users").select("id").eq("remonline_id", data.id).single()

      if (user) {
        // You may choose to mark as inactive instead of deleting
        // This is just an example
        await supabase.from("users").update({ active: false }).eq("id", user.id)

        return NextResponse.json({
          success: true,
          message: "User marked as inactive",
        })
      }

      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Webhook received successfully",
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
