import { createClient } from "@/lib/supabase"

type SupabaseClient = ReturnType<typeof createClient>

type OrderSyncIssueStatus = "open" | "resolved" | "ignored"

type PayloadObject = {
  id?: string | number | null
  event_name?: string | null
  context?: {
    object_id?: string | number | null
  } | null
  metadata?: {
    order?: {
      id?: string | number | null
      client?: {
        id?: string | number | null
      } | null
    } | null
    client?: {
      id?: string | number | null
    } | null
  } | null
}

type RecordOrderSyncIssueInput = {
  payload?: PayloadObject | null
  reason: string
  details?: string | null
  supabase?: SupabaseClient
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getPayloadOrderId(payload?: PayloadObject | null): number | null {
  return numberOrNull(payload?.context?.object_id ?? payload?.metadata?.order?.id)
}

function getPayloadClientId(payload?: PayloadObject | null): number | null {
  return numberOrNull(payload?.metadata?.client?.id ?? payload?.metadata?.order?.client?.id)
}

function getPayloadEventId(payload?: PayloadObject | null): string {
  return String(payload?.id || `${payload?.event_name || "unknown"}:${Date.now()}`)
}

export async function recordOrderSyncIssue(input: RecordOrderSyncIssueInput) {
  const supabase = input.supabase || createClient()
  const remonlineEventId = getPayloadEventId(input.payload)
  const now = new Date().toISOString()

  const { data: existingIssue } = await supabase
    .from("remonline_order_sync_issues")
    .select("id, attempts")
    .eq("remonline_event_id", remonlineEventId)
    .maybeSingle()

  const row = {
    remonline_event_id: remonlineEventId,
    event_name: String(input.payload?.event_name || "unknown"),
    remonline_order_id: getPayloadOrderId(input.payload),
    remonline_client_id: getPayloadClientId(input.payload),
    status: "open" as OrderSyncIssueStatus,
    reason: input.reason,
    details: input.details || null,
    raw_payload: input.payload || {},
    attempts: (existingIssue?.attempts || 0) + 1,
    ...(existingIssue ? {} : { first_seen_at: now }),
    last_seen_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .upsert(row, { onConflict: "remonline_event_id" })
    .select("*")
    .single()

  if (error) {
    console.error("Failed to record RemOnline order sync issue:", error)
    return null
  }

  return data
}

export async function resolveOrderSyncIssues(
  remonlineOrderId: number,
  resolvedBy?: string,
  supabase: SupabaseClient = createClient(),
) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .update({
      status: "resolved",
      resolved_at: now,
      resolved_by: resolvedBy || null,
      updated_at: now,
    })
    .eq("remonline_order_id", remonlineOrderId)
    .eq("status", "open")
    .select("*")

  if (error) throw new Error(`Failed to resolve order sync issues: ${error.message}`)
  return data || []
}

export async function ignoreOrderSyncIssue(
  issueId: string,
  ignoredBy: string,
  supabase: SupabaseClient = createClient(),
) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .update({
      status: "ignored",
      ignored_at: now,
      ignored_by: ignoredBy,
      updated_at: now,
    })
    .eq("id", issueId)
    .select("*")
    .single()

  if (error) throw new Error(`Failed to ignore order sync issue: ${error.message}`)
  return data
}

export async function listOrderSyncIssues(
  status: OrderSyncIssueStatus = "open",
  supabase: SupabaseClient = createClient(),
) {
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .select("*")
    .eq("status", status)
    .order("last_seen_at", { ascending: false })

  if (error) throw new Error(`Failed to list order sync issues: ${error.message}`)
  return data || []
}
