import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import contactPayload from "@/lib/services/remonline-contact-payload"

const { buildRemonlineContactPayload } = contactPayload

type SupabaseClient = ReturnType<typeof createClient>

type SyncOptions = {
  supabase?: SupabaseClient
}

type SyncResult = {
  success: boolean
  message?: string
  remonlineId?: number
  contactType?: "person" | "organization"
}

type RemonlineContactPayload = {
  contactType: "person" | "organization"
  body: Record<string, any>
}

const USER_SYNC_SELECT = `
  id,
  email,
  first_name,
  last_name,
  is_b2b,
  ico,
  dic,
  company_name,
  remonline_id,
  remonline_contact_type,
  remonline_sync_attempts,
  profiles!left(phone, address, billing_street, billing_city, billing_postal_code, billing_country)
`

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500)
  return String(error || "Unknown RemOnline sync error").slice(0, 500)
}

function firstProfile(profiles: unknown) {
  if (Array.isArray(profiles)) return profiles[0] || {}
  if (profiles && typeof profiles === "object") return profiles
  return {}
}

function getAttemptCount(user: any) {
  const attempts = Number(user?.remonline_sync_attempts || 0)
  return Number.isFinite(attempts) && attempts >= 0 ? attempts : 0
}

function getExistingRemonlineId(user: any) {
  const id = Number(user?.remonline_id)
  return Number.isFinite(id) && id > 0 ? id : null
}

async function markSyncPending(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("users")
    .update({
      remonline_sync_status: "pending",
      remonline_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
}

async function markSyncError(
  supabase: SupabaseClient,
  userId: string,
  message: string,
  attempts?: number,
  contactType?: "person" | "organization",
) {
  const update: Record<string, any> = {
    remonline_sync_status: "error",
    remonline_sync_error: message.slice(0, 500),
    updated_at: new Date().toISOString(),
  }

  if (attempts !== undefined) update.remonline_sync_attempts = attempts
  if (contactType) update.remonline_contact_type = contactType

  await supabase.from("users").update(update).eq("id", userId)
}

async function markSyncSuccess(
  supabase: SupabaseClient,
  userId: string,
  remonlineId: number,
  contactType: "person" | "organization",
  attempts: number,
) {
  await supabase
    .from("users")
    .update({
      remonline_id: remonlineId,
      remonline_contact_type: contactType,
      remonline_sync_status: "synced",
      remonline_sync_error: null,
      remonline_synced_at: new Date().toISOString(),
      remonline_sync_attempts: attempts,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
}

async function sendContactPayload(payload: any, existingId: number | null) {
  if (existingId) {
    return payload.contactType === "organization"
      ? remonline.updateOrganization(existingId, payload.body)
      : remonline.updatePerson(existingId, payload.body)
  }

  return payload.contactType === "organization"
    ? remonline.createOrganization(payload.body)
    : remonline.createPerson(payload.body)
}

export async function syncUserToRemonline(userId: string, options: SyncOptions = {}): Promise<SyncResult> {
  const supabase = options.supabase || createClient()
  let attemptedContactType: "person" | "organization" | undefined
  let attemptedCount: number | undefined

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(USER_SYNC_SELECT)
      .eq("id", userId)
      .single()

    if (error || !user) {
      const message = error?.message || "User not found"
      await markSyncError(supabase, userId, message)
      return { success: false, message }
    }

    await markSyncPending(supabase, userId)

    const profile = firstProfile((user as any).profiles)
    const payload = buildRemonlineContactPayload({ ...(user as any), ...(profile as any) }) as RemonlineContactPayload
    const nextAttempts = getAttemptCount(user) + 1
    attemptedContactType = payload.contactType
    attemptedCount = nextAttempts
    const result = await sendContactPayload(payload, getExistingRemonlineId(user))

    if (!result.success || !result.id) {
      const message = result.message || "RO App did not return a contact id"
      await markSyncError(supabase, userId, message, nextAttempts, payload.contactType)
      return { success: false, message, contactType: payload.contactType }
    }

    await markSyncSuccess(supabase, userId, result.id, payload.contactType, nextAttempts)

    return {
      success: true,
      remonlineId: result.id,
      contactType: payload.contactType,
    }
  } catch (error) {
    const message = safeErrorMessage(error)
    await markSyncError(supabase, userId, message, attemptedCount, attemptedContactType)
    return { success: false, message }
  }
}

export async function syncClientToRemonline(_userData?: unknown): Promise<SyncResult> {
  return {
    success: false,
    message: "syncClientToRemonline is deprecated. Use syncUserToRemonline(userId).",
  }
}

export async function updateRemonlineIdForUser(userId: string, remonlineId: number) {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("users")
      .update({
        remonline_id: remonlineId,
        remonline_sync_status: "synced",
        remonline_sync_error: null,
        remonline_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.error("Error updating RemOnline ID for user:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating RemOnline ID for user:", error)
    return false
  }
}
