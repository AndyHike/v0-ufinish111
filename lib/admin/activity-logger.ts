import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createServerClient } from "@/utils/supabase/server"

type ActivityType = "create" | "update" | "delete" | "view"
type EntityType = "brand" | "series" | "model" | "repair" | "user" | "discount"

interface LogActivityParams {
  entityId: string
  actionType: ActivityType
  entityType: EntityType
  userId?: string
  details?: Record<string, any>
}

export async function logActivity({
  userId = "system",
  actionType,
  entityType,
  entityId,
  details = {},
}: {
  userId?: string | null
  actionType: ActivityType
  entityType: EntityType
  entityId: string
  details?: Record<string, any>
}) {
  try {
    const supabase = createClient()

    await supabase.from("activities").insert([
      {
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ])

    return true
  } catch (error) {
    console.error("Error logging activity:", error)
    return false
  }
}

export async function logAdminActivity({ entityId, actionType, entityType, userId, details = {} }: LogActivityParams) {
  try {
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
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    ])

    return true
  } catch (error) {
    console.error("Error logging admin activity:", error)
    return false
  }
}
