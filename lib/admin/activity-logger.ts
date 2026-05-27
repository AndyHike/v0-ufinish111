import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createServerClient } from "@/utils/supabase/server"

type ActivityType = "create" | "update" | "delete" | "view"
type EntityType = "brand" | "series" | "model" | "repair" | "user" | "discount" | "role"

interface LogActivityParams {
  entityId: string
  actionType?: ActivityType
  entityType?: EntityType
  action?: ActivityType
  entity?: EntityType
  userId?: string | null
  details?: Record<string, any> | string
}

export async function logActivity({
  userId = "system",
  actionType,
  entityType,
  action,
  entity,
  entityId,
  details = {},
}: LogActivityParams & { userId?: string | null }) {
  try {
    const resolvedActionType = actionType || action
    const resolvedEntityType = entityType || entity

    if (!resolvedActionType || !resolvedEntityType) {
      console.error("Missing action/entity for activity logging")
      return false
    }

    const supabase = createClient()
    const normalizedDetails = typeof details === "string" ? { message: details } : details

    await supabase.from("activities").insert([
      {
        user_id: userId,
        action_type: resolvedActionType,
        entity_type: resolvedEntityType,
        entity_id: entityId,
        details: normalizedDetails,
      },
    ])

    return true
  } catch (error) {
    console.error("Error logging activity:", error)
    return false
  }
}

export async function logAdminActivity({ entityId, actionType, entityType, action, entity, userId, details = {} }: LogActivityParams) {
  try {
    const resolvedActionType = actionType || action
    const resolvedEntityType = entityType || entity

    if (!resolvedActionType || !resolvedEntityType) {
      console.error("Missing action/entity for admin activity logging")
      return false
    }

    const supabase = await createServerClient()

    // Get current admin user if userId is not provided
    let adminId = userId
    if (!adminId) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      adminId = session?.user?.id
    }

    if (!adminId) {
      console.error("No user ID available for activity logging")
      return false
    }

    await supabase.from("activities").insert([
      {
        user_id: adminId,
        action_type: resolvedActionType,
        entity_type: resolvedEntityType,
        entity_id: entityId,
        details: typeof details === "string" ? { message: details } : details,
      },
    ])

    return true
  } catch (error) {
    console.error("Error logging admin activity:", error)
    return false
  }
}
