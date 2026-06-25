"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import {
  generateVerificationCode,
  saveVerificationCode,
  verifyCode as verifyCodeLib,
} from "@/lib/auth/verification-code"
import { sendVerificationCode as sendVerificationCodeEmail, sendEmail } from "@/lib/email/send-email"
import { sendTelegramNotification } from "@/lib/telegram/send-telegram"
import { syncUserToRemonline } from "@/lib/services/remonline-sync"
import { hash } from "@/lib/auth/utils"
import { revalidatePath } from "next/cache"

async function setSecureCookie(name: string, value: string, maxAge: number = 30 * 24 * 60 * 60) {
  const isProduction = process.env.NODE_ENV === "production"

  const cookieStore = await cookies()
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: isProduction,
    maxAge,
    path: "/",
    sameSite: "lax", // Changed from "strict" to "lax" for better cross-origin support
  })

  if (process.env.NODE_ENV === "development") {
    console.log(`[v0] Cookie set: ${name}=${value}, secure=${isProduction}, sameSite=lax`)
  }
}

function buildBillingAddress(userData: {
  billingStreet?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
}) {
  const hasBillingAddress = Boolean(userData.billingStreet || userData.billingCity || userData.billingPostalCode)
  if (!hasBillingAddress) return ""

  const cityLine = [userData.billingPostalCode, userData.billingCity].filter(Boolean).join(" ")
  return [userData.billingStreet, cityLine, userData.billingCountry || "CZ"].filter(Boolean).join(", ")
}

// Check if user exists in our database
export async function checkUserExists(identifier: string): Promise<{
  success: boolean
  message?: string
  userData?: {
    id: string
    email: string
    name: string
    phone?: string
  }
}> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`Checking if user exists with identifier: ${identifier}`)
    }

    const supabase = createClient()

    // Determine if identifier is email or phone
    const isEmail = identifier.includes("@")

    let userData

    if (isEmail) {
      // Search by email
      const { data, error } = await supabase
        .from("users")
        .select(`
          id, 
          email, 
          first_name,
          last_name,
          profiles!inner(phone)
        `)
        .eq("email", identifier.toLowerCase())
        .maybeSingle()

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking user by email:", error)
        }
        return {
          success: false,
          message: "Error checking user. Please try again later.",
        }
      }

      userData = data
    } else {
      // Search by phone
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          phone,
          email,
          first_name,
          last_name,
          users!inner(id, email, first_name, last_name)
        `)
        .eq("phone", identifier)
        .maybeSingle()

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error checking user by phone:", error)
        }
        return {
          success: false,
          message: "Error checking user. Please try again later.",
        }
      }

      if (data) {
        userData = {
          id: (data as any).users.id,
          email: (data as any).users.email,
          name: `${(data as any).users.first_name} ${(data as any).users.last_name}`.trim(),
          phone: data.phone,
        }
      }
    }

    if (userData) {
      return {
        success: true,
        userData: {
          id: (userData as any).id,
          email: (userData as any).email,
          name: (userData as any).name,
          phone: (userData as any).phone,
        },
      }
    }

    return {
      success: false,
      message: "User not found",
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Check user error:", error)
    }
    return {
      success: false,
      message: "Failed to check if user exists. Please try again later.",
    }
  }
}

// Send verification code
export async function sendVerificationCode(
  identifier: string,
  type: "login" | "registration",
  locale: string = "uk",
): Promise<{ success: boolean; message?: string; email?: string }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`Sending verification code for ${type} to identifier: ${identifier}`)
    }

    // If identifier is an email, use it directly
    // If it's a phone number, we need to find the associated email
    let email = identifier

    if (!identifier.includes("@")) {
      // It's a phone number, find the associated email
      const userResult = await checkUserExists(identifier)
      if (!userResult.success || !userResult.userData) {
        return {
          success: false,
          message: "Could not find a user with this phone number",
        }
      }

      email = userResult.userData.email
    }

    // Generate verification code
    const code = generateVerificationCode()
    if (process.env.NODE_ENV === "development") {
      console.log(`Generated code: ${code}`)
    }

    // Save code to database
    const saved = await saveVerificationCode(email, code, type)
    if (!saved) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to save verification code to database")
      }
      return {
        success: false,
        message: "Failed to generate verification code",
      }
    }

    // Send email with code
    try {
      await sendVerificationCodeEmail(email, code, locale, type === "login")
      if (process.env.NODE_ENV === "development") {
        console.log(`Verification code sent to ${email}`)
      }
      return { success: true, email }
    } catch (emailError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to send verification email:", emailError)
      }
      return {
        success: false,
        message: "Failed to send verification email",
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Send verification code error:", error)
    }
    return {
      success: false,
      message: "Failed to send verification code. Please try again later.",
    }
  }
}

// Verify code and create session
export async function verifyCode(
  identifier: string,
  code: string,
  type: "login" | "registration",
): Promise<{ success: boolean; message?: string; role?: string }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log(`[v0] Verifying code for ${identifier}: ${code}`)
    }

    // If identifier is a phone number, we need to find the associated email
    let email = identifier
    let userId = null
    let userRole = "user"

    if (!identifier.includes("@")) {
      // It's a phone number, find the associated email
      const userResult = await checkUserExists(identifier)
      if (!userResult.success || !userResult.userData) {
        return {
          success: false,
          message: "Could not find a user with this phone number",
        }
      }

      email = userResult.userData.email
      userId = userResult.userData.id
    } else {
      // It's an email, get the user ID
      const userResult = await checkUserExists(identifier)
      if (userResult.success && userResult.userData) {
        userId = userResult.userData.id
      }
    }

    // Verify code
    const verification = await verifyCodeLib(email, code, type)
    if (!verification.valid) {
      if (process.env.NODE_ENV === "development") {
        console.error("[v0] Invalid verification code:", verification.message)
      }
      return {
        success: false,
        message: verification.message || "Invalid verification code",
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[v0] Code verified successfully for email: ${email}`)
    }

    if (type === "login") {
      // For login, create session
      const supabase = createClient()

      // If we don't have a userId yet, get it from the database
      if (!userId) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, role, is_approved")
          .eq("email", email.toLowerCase())
          .maybeSingle()

        if (!userData) {
          return {
            success: false,
            message: "User not found",
          }
        }

        // Check if user is approved
        if (userData.is_approved === false) {
          return {
            success: false,
            message: "accountPendingApproval",
          }
        }

        userId = userData.id
        userRole = userData.role || "user"
      } else {
        // Get user role and approval status
        const { data: userData } = await supabase.from("users").select("role, is_approved").eq("id", userId).maybeSingle()

        if (userData) {
          // Check if user is approved
          if (userData.is_approved === false) {
            return {
              success: false,
              message: "accountPendingApproval",
            }
          }
          userRole = userData.role || "user"
        }
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert([
          {
            user_id: userId,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          },
        ])
        .select("id")
        .single()

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[v0] Failed to create session:", sessionError)
        }
        return {
          success: false,
          message: "Failed to create session",
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[v0] Session created: ${session.id}, setting cookies...`)
      }

      await setSecureCookie("session_id", session.id)
      await setSecureCookie("user_role", userRole)

      if (process.env.NODE_ENV === "development") {
        console.log(`[v0] Cookies set successfully for user ${userId}`)
      }

      revalidatePath("/", "layout")
    }

    return { success: true, role: userRole }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Verify code error:", error)
    }
    return {
      success: false,
      message: "Failed to verify code. Please try again later.",
    }
  }
}

// Notify the admin (email + Telegram) about a new registration.
// Two distinct types so the owner can react fast:
//   - "new"     → account is active immediately (auto-approved)
//   - "pending" → account waits for manual approval
async function notifyAdminOfRegistration(info: {
  type: "new" | "pending"
  name: string
  email: string
  phone?: string | null
  isB2B: boolean
  companyName?: string | null
  ico?: string | null
  role: string
  locale: string
}) {
  const isPending = info.type === "pending"
  const accountKind = info.isB2B ? "B2B / firemní" : "Soukromý"
  const companyLine = info.isB2B
    ? [info.companyName ? `Компанія: ${info.companyName}` : null, info.ico ? `IČO: ${info.ico}` : null]
        .filter(Boolean)
        .join("\n")
    : ""

  // Telegram (HTML)
  const telegramMessage = [
    isPending ? `⏳ <b>Реєстрація очікує схвалення</b>` : `🆕 <b>Нова реєстрація</b>`,
    ``,
    `<b>Тип акаунта:</b> ${accountKind} (${info.role})`,
    `<b>Ім'я:</b> ${info.name}`,
    `<b>Email:</b> ${info.email}`,
    info.phone ? `<b>Телефон:</b> ${info.phone}` : null,
    info.isB2B && info.companyName ? `<b>Компанія:</b> ${info.companyName}` : null,
    info.isB2B && info.ico ? `<b>IČO:</b> ${info.ico}` : null,
    isPending ? `\n⚠️ <b>Потрібно схвалити акаунт в адмінці.</b>` : null,
  ]
    .filter(Boolean)
    .join("\n")

  // Email (HTML)
  const heading = isPending ? "Реєстрація очікує схвалення" : "Нова реєстрація"
  const emailHtml = `
    <h2>${isPending ? "⏳" : "🆕"} ${heading}</h2>
    <p><strong>Тип акаунта:</strong> ${accountKind} (${info.role})</p>
    <p><strong>Ім'я:</strong> ${info.name}</p>
    <p><strong>Email:</strong> ${info.email}</p>
    ${info.phone ? `<p><strong>Телефон:</strong> ${info.phone}</p>` : ""}
    ${companyLine ? `<p>${companyLine.replace(/\n/g, "<br/>")}</p>` : ""}
    ${isPending ? `<p style="color:#b45309;"><strong>⚠️ Потрібно схвалити акаунт в адмінці.</strong></p>` : ""}
  `

  const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_FROM?.trim() || "info@devicehelp.cz"
  const subject = isPending
    ? `Реєстрація очікує схвалення - ${info.name}`
    : `Нова реєстрація - ${info.name}`

  // Fire both; never let a notification failure break registration.
  const [emailSent, telegramSent] = await Promise.all([
    sendEmail(notificationEmail, subject, emailHtml, info.email).catch(() => false),
    sendTelegramNotification(telegramMessage).catch(() => false),
  ])

  if (process.env.NODE_ENV === "development") {
    console.log(`[registration] admin notified (type=${info.type}) email=${emailSent} telegram=${telegramSent}`)
  }
}

// Create user in our database and sync with RemOnline in the background
export async function createUser(userData: {
  first_name: string
  last_name: string
  email: string
  phone: string[]
  locale?: string
  address?: string
  is_b2b?: boolean
  ico?: string
  dic?: string
  companyName?: string
  billingStreet?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountry?: string
}): Promise<{ success: boolean; message?: string; needsApproval?: boolean }> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("Creating user in database:", userData)
    }

    const supabase = createClient()
    const billingAddress = userData.address || buildBillingAddress(userData)
    const userLocale = userData.locale && ["uk", "en", "cs"].includes(userData.locale) ? userData.locale : "uk"

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email.toLowerCase())
      .maybeSingle()

    if (existingUser) {
      if (process.env.NODE_ENV === "development") {
        console.log("User already exists in database:", existingUser)
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert([
          {
            user_id: existingUser.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
        .select("id")
        .single()

      if (sessionError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to create session:", sessionError)
        }
        return {
          success: false,
          message: "Failed to create session",
        }
      }

      await setSecureCookie("session_id", session.id)

      syncUserToRemonline(existingUser.id).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error syncing existing user with RemOnline:", error)
        }
      })

      return { success: true }
    }

    // Generate a random password (user will use passwordless login anyway)
    const randomPassword = Math.random().toString(36).slice(-10)
    const passwordHash = await hash(randomPassword)

    // Determine role based on B2B flag
    let roleSlug = "user"
    let autoApprove = true

    if (userData.is_b2b) {
      roleSlug = "b2b"
    }

    // Look up role from roles table
    const { data: roleData } = await supabase
      .from("roles")
      .select("id, auto_approve")
      .eq("slug", roleSlug)
      .single()

    // Fallback to default role if specific role not found
    let roleId = roleData?.id
    if (!roleId) {
      const { data: defaultRole } = await supabase
        .from("roles")
        .select("id, auto_approve")
        .eq("is_default", true)
        .single()
      roleId = defaultRole?.id
      autoApprove = defaultRole?.auto_approve ?? true
    } else {
      autoApprove = roleData?.auto_approve ?? true
    }

    const isApproved = autoApprove

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email: userData.email.toLowerCase(),
        role: roleSlug,
        role_id: roleId || null,
        first_name: userData.first_name,
        last_name: userData.last_name,
        locale: userLocale,
        password_hash: passwordHash,
        email_verified: true,
        is_b2b: userData.is_b2b || false,
        ico: userData.ico || null,
        dic: userData.dic || null,
        company_name: userData.companyName || null,
        is_approved: isApproved,
        remonline_sync_status: "pending",
        remonline_sync_attempts: 0,
      })
      .select("id")
      .single()

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create user in database:", error)
      }
      return {
        success: false,
        message: "Failed to create user account",
      }
    }

    // Create profile with email
    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone[0] || null,
      email: userData.email.toLowerCase(),
      address: billingAddress || null,
      billing_street: userData.billingStreet || null,
      billing_city: userData.billingCity || null,
      billing_postal_code: userData.billingPostalCode || null,
      billing_country: userData.billingCountry || "CZ",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create profile in database:", profileError)
      }
      await supabase.from("users").delete().eq("id", newUser.id)
      return {
        success: false,
        message: "Failed to create user profile",
      }
    }

    // Notify the admin about the new registration (non-blocking, never throws).
    await notifyAdminOfRegistration({
      type: isApproved ? "new" : "pending",
      name: `${userData.first_name} ${userData.last_name}`.trim(),
      email: userData.email.toLowerCase(),
      phone: userData.phone[0] || null,
      isB2B: userData.is_b2b || false,
      companyName: userData.companyName || null,
      ico: userData.ico || null,
      role: roleSlug,
      locale: userLocale,
    })

    syncUserToRemonline(newUser.id).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error syncing user with RemOnline:", error)
      }
    })

    // If user doesn't need approval, create session immediately
    if (!isApproved) {
      if (process.env.NODE_ENV === "development") {
        console.log("User needs admin approval, skipping session creation")
      }
      return { success: true, needsApproval: true }
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          user_id: newUser.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select("id")
      .single()

    if (sessionError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to create session:", sessionError)
      }
      return {
        success: false,
        message: "Failed to create session",
      }
    }

    await setSecureCookie("session_id", session.id)

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Create user error:", error)
    }
    return {
      success: false,
      message: "Failed to create user. Please try again later.",
    }
  }
}
