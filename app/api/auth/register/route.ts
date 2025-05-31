import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { hashPassword } from "@/lib/auth/utils"
import { generateEmailVerificationToken } from "@/lib/auth/token"
import { sendVerificationEmail } from "@/lib/email/send-email"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string
    const locale = (formData.get("locale") as string) || "en"

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).single()

    if (existingUser) {
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Insert user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        role: "user",
        email_verified: false,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error registering user:", error)
      return NextResponse.json({ success: false, message: "Failed to register user" }, { status: 500 })
    }

    // Insert profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      name,
      phone,
      avatar_url: `/placeholder.svg?height=100&width=100&query=${encodeURIComponent(name)}`,
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Clean up the user if profile creation fails
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ success: false, message: "Failed to create user profile" }, { status: 500 })
    }

    // Generate verification token
    const token = await generateEmailVerificationToken(user.id)

    if (token) {
      // Send verification email
      try {
        await sendVerificationEmail(email, token, locale)
      } catch (emailError) {
        console.error("Error sending verification email:", emailError)
        // Continue with registration even if email fails
      }
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error("Error in register function:", error)
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 })
  }
}
