import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import { OrderService } from "@/app/api/webhooks/remonline/services/order-service"
import { recordOrderSyncIssue, resolveOrderSyncIssues } from "@/lib/services/remonline-order-sync-issues"

type SyncOrderResult = {
  success: boolean
  message?: string
  order?: any
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error || "Failed to sync order")
}

function getOrderClientId(order: any): number | null {
  const rawId = order?.client?.id ?? order?.client_id ?? order?.customer?.id
  const id = Number(rawId)
  return Number.isFinite(id) ? id : null
}

function buildManualIssuePayload(remonlineOrderId: number, clientId?: number | null) {
  return {
    id: `manual:${remonlineOrderId}`,
    event_name: "Manual.Order.Sync",
    context: { object_id: remonlineOrderId },
    metadata: clientId ? { client: { id: clientId } } : {},
  }
}

export async function syncOrderFromRemonline(
  remonlineOrderId: number,
  adminUserId?: string,
): Promise<SyncOrderResult> {
  try {
    const orderResult = await remonline.getOrderById(remonlineOrderId)

    if (!orderResult.success || !orderResult.order) {
      return {
        success: false,
        message: orderResult.message || "Failed to fetch order from RemOnline",
      }
    }

    const itemsResult = await remonline.getOrderItems(remonlineOrderId)

    if (!itemsResult.success) {
      return {
        success: false,
        message: itemsResult.message || "Failed to fetch order items from RemOnline",
      }
    }

    const clientId = getOrderClientId(orderResult.order)

    if (!clientId) {
      await recordOrderSyncIssue({
        payload: buildManualIssuePayload(remonlineOrderId),
        reason: "client_not_linked",
        details: "RemOnline order response did not include a client id",
      })

      return {
        success: false,
        message: "RemOnline order response did not include a client id",
      }
    }

    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("remonline_id", clientId)
      .maybeSingle()

    if (userError) {
      return {
        success: false,
        message: `Failed to find local user: ${userError.message}`,
      }
    }

    if (!user) {
      await recordOrderSyncIssue({
        payload: buildManualIssuePayload(remonlineOrderId, clientId),
        reason: "client_not_linked",
        details: `No local user found for RemOnline client ${clientId}`,
        supabase,
      })

      return {
        success: false,
        message: `No local user found for RemOnline client ${clientId}`,
      }
    }

    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromRemonlineApi(
      user.id,
      remonlineOrderId,
      orderResult.order,
      itemsResult.items || [],
    )

    await resolveOrderSyncIssues(remonlineOrderId, adminUserId, supabase)

    return {
      success: true,
      order,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}
