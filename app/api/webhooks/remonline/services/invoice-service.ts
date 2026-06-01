type InvoiceSyncSource = "webhook" | "manual"

type InvoicePayloadOptions = {
  source?: InvoiceSyncSource
}

type JsonRecord = Record<string, any>
type InvoiceOrderLinkState = {
  present: boolean
  orderIds: number[]
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown): string | null {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function toDateText(value: unknown): string | null {
  const text = toText(value)
  if (!text) return null
  const parsed = Date.parse(text)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined)
}

function getNestedId(value: unknown): number | null {
  if (isRecord(value)) return toNumber(value.id)
  return toNumber(value)
}

function getNestedName(value: unknown): string | null {
  if (!isRecord(value)) return null
  return toText(value.name) ?? toText(value.fullname) ?? toText(value.full_name) ?? toText(value.title)
}

function hasOwnValue(record: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

function extractInvoicePayload(input: JsonRecord): JsonRecord {
  const metadata = isRecord(input.metadata) ? input.metadata : undefined
  const metadataInvoice = metadata?.invoice
  if (isRecord(metadataInvoice)) {
    const client = isRecord(metadata?.client) ? metadata?.client : undefined
    const payer = isRecord(metadata?.payer) ? metadata?.payer : undefined
    const manager = isRecord(metadata?.manager) ? metadata?.manager : undefined

    return {
      ...metadataInvoice,
      ...(metadataInvoice.client === undefined && client !== undefined ? { client } : {}),
      ...(metadataInvoice.payer === undefined && payer !== undefined ? { payer } : {}),
      ...(metadataInvoice.manager === undefined && manager !== undefined ? { manager } : {}),
    }
  }

  const directInvoice = input.invoice
  if (isRecord(directInvoice)) return directInvoice

  const data = input.data
  if (isRecord(data)) return data

  return input
}

function hasInvoiceNumber(input: JsonRecord): boolean {
  const invoice = extractInvoicePayload(input)
  return [invoice.number, invoice.name, invoice.id_label, invoice.label].some((value) => value !== undefined && value !== null)
}

function extractInvoiceId(input: JsonRecord, invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.id, invoice.invoice_id, input.context?.object_id, input.object_id))
}

function extractClientId(invoice: JsonRecord): number | null {
  return (
    toNumber(firstPresent(invoice.client_id, invoice.clientId, invoice.customer_id, invoice.customerId)) ??
    getNestedId(invoice.client) ??
    getNestedId(invoice.customer)
  )
}

function extractPayerId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.payer_id, invoice.payerId)) ?? getNestedId(invoice.payer)
}

function extractManagerId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.manager_id, invoice.managerId)) ?? getNestedId(invoice.manager)
}

function extractStatusId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.status_id, invoice.statusId)) ?? getNestedId(invoice.status)
}

function extractStatusName(invoice: JsonRecord): string | null {
  return toText(invoice.status_name) ?? toText(invoice.statusName) ?? getNestedName(invoice.status)
}

function extractStatusGroup(invoice: JsonRecord): string | null {
  if (isRecord(invoice.status)) return toText(invoice.status.group) ?? toText(invoice.status.type)
  return toText(invoice.status_group) ?? toText(invoice.statusGroup)
}

function extractAmount(invoice: JsonRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(invoice[key])
    if (value !== null) return value
  }
  return null
}

function addOrderId(orderIds: Set<number>, value: unknown) {
  const id = toNumber(value)
  if (id && Number.isInteger(id) && id > 0) orderIds.add(id)
}

function collectOrderIds(value: unknown, orderIds: Set<number>, allowGenericId = false) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectOrderIds(item, orderIds, allowGenericId)
    }
    return
  }

  if (!isRecord(value)) {
    addOrderId(orderIds, value)
    return
  }

  addOrderId(orderIds, firstPresent(value.order_id, value.orderId, value.remonline_order_id, value.remonlineOrderId))

  const type = toText(firstPresent(value.object_type, value.objectType, value.document_type, value.documentType, value.type))
  const looksLikeOrder = !type || /order/i.test(type)

  if (allowGenericId && looksLikeOrder) {
    addOrderId(orderIds, value.id)
    addOrderId(orderIds, firstPresent(value.object_id, value.objectId))
  }
}

function extractInvoiceOrderLinkState(input: JsonRecord): InvoiceOrderLinkState {
  const invoice = extractInvoicePayload(input)
  const metadata = isRecord(input.metadata) ? input.metadata : {}
  const orderIds = new Set<number>()
  const candidates: Array<{ value: unknown; allowGenericId?: boolean }> = []

  if (hasOwnValue(invoice, "orders")) candidates.push({ value: invoice.orders, allowGenericId: true })
  if (hasOwnValue(invoice, "order")) candidates.push({ value: invoice.order, allowGenericId: true })
  if (hasOwnValue(invoice, "order_ids")) candidates.push({ value: invoice.order_ids })
  if (hasOwnValue(invoice, "orderIds")) candidates.push({ value: invoice.orderIds })
  if (hasOwnValue(invoice, "remonline_order_ids")) candidates.push({ value: invoice.remonline_order_ids })
  if (hasOwnValue(invoice, "remonlineOrderIds")) candidates.push({ value: invoice.remonlineOrderIds })
  if (hasOwnValue(invoice, "documents")) candidates.push({ value: invoice.documents, allowGenericId: true })
  if (hasOwnValue(invoice, "docs")) candidates.push({ value: invoice.docs, allowGenericId: true })
  if (hasOwnValue(metadata, "order")) candidates.push({ value: metadata.order, allowGenericId: true })
  if (hasOwnValue(metadata, "orders")) candidates.push({ value: metadata.orders, allowGenericId: true })
  if (hasOwnValue(metadata, "documents")) candidates.push({ value: metadata.documents, allowGenericId: true })

  for (const candidate of candidates) {
    collectOrderIds(candidate.value, orderIds, Boolean(candidate.allowGenericId))
  }

  return {
    present: candidates.length > 0,
    orderIds: [...orderIds],
  }
}

export function normalizeInvoicePayload(input: JsonRecord, userId: string | null, source: InvoiceSyncSource = "webhook") {
  const invoice = extractInvoicePayload(input)
  const remonlineInvoiceId = extractInvoiceId(input, invoice)

  if (!remonlineInvoiceId) {
    throw new Error("RemOnline invoice id is missing")
  }

  const invoiceNumber =
    toText(firstPresent(invoice.number, invoice.name, invoice.id_label, invoice.label)) ?? String(remonlineInvoiceId)
  const client = invoice.client ?? invoice.customer
  const payer = invoice.payer
  const manager = invoice.manager
  const now = new Date().toISOString()

  return {
    remonline_invoice_id: remonlineInvoiceId,
    user_id: userId,
    invoice_number: invoiceNumber,
    status_id: extractStatusId(invoice),
    status_name: extractStatusName(invoice),
    status_group: extractStatusGroup(invoice),
    issue_date: toDateText(firstPresent(invoice.issue_date, invoice.issueDate, invoice.issued_at, invoice.issuedAt)),
    due_date: toDateText(firstPresent(invoice.due_date, invoice.dueDate)),
    created_at_remonline: toDateText(firstPresent(invoice.created_at, invoice.createdAt, input.created_at)),
    modified_at_remonline: toDateText(
      firstPresent(invoice.modified_at, invoice.modifiedAt, invoice.updated_at, invoice.updatedAt),
    ),
    payment_method: toText(firstPresent(invoice.payment_method, invoice.paymentMethod)),
    client_id: extractClientId(invoice),
    client_name: toText(invoice.client_name) ?? toText(invoice.customer_name) ?? getNestedName(client),
    payer_id: extractPayerId(invoice),
    payer_name: toText(invoice.payer_name) ?? getNestedName(payer),
    manager_id: extractManagerId(invoice),
    manager_name: toText(invoice.manager_name) ?? getNestedName(manager),
    subtotal_amount: extractAmount(invoice, "subtotal_amount", "subtotalAmount", "subtotal", "amount_without_discount"),
    discount_amount: extractAmount(invoice, "discount_amount", "discountAmount", "discount"),
    total_amount: extractAmount(invoice, "total_amount", "totalAmount", "total", "sum", "amount"),
    paid_amount: extractAmount(invoice, "paid_amount", "paidAmount", "paid"),
    balance_amount: extractAmount(invoice, "balance_amount", "balanceAmount", "balance", "debt"),
    currency: toText(invoice.currency),
    raw_payload: input,
    sync_source: source,
    sync_status: "synced",
    sync_error: null,
    is_deleted: false,
    last_synced_at: source === "manual" ? now : null,
    updated_at: now,
  }
}

function mergeInvoiceForUpsert(
  normalized: JsonRecord,
  existing: JsonRecord | null,
  options: { preserveIfExisting?: Iterable<string> } = {},
) {
  if (!existing) return normalized

  const alwaysFreshFields = new Set([
    "raw_payload",
    "sync_source",
    "sync_status",
    "sync_error",
    "is_deleted",
    "last_synced_at",
    "updated_at",
    "remonline_invoice_id",
  ])
  const preserveIfExisting = new Set(options.preserveIfExisting ?? [])

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [
      key,
      preserveIfExisting.has(key)
        ? existing[key]
        : alwaysFreshFields.has(key) || (value !== null && value !== undefined)
          ? value
          : existing[key],
    ]),
  )
}

export class InvoiceService {
  constructor(private supabase: any) {}

  private async findUserId(clientId: number | null): Promise<string | null> {
    if (!clientId) return null

    const { data, error } = await this.supabase
      .from("users")
      .select("id")
      .eq("remonline_id", clientId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to find user by RemOnline client id ${clientId}: ${error.message}`)
    }

    return data?.id ?? null
  }

  private async findExistingInvoice(remonlineInvoiceId: number) {
    const { data, error } = await this.supabase
      .from("user_invoices")
      .select("*")
      .eq("remonline_invoice_id", remonlineInvoiceId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to read invoice ${remonlineInvoiceId}: ${error.message}`)
    }

    return data ?? null
  }

  private async syncInvoiceOrderLinks(
    invoiceId: string,
    remonlineInvoiceId: number,
    linkState: InvoiceOrderLinkState,
    rawPayload: JsonRecord,
    fallbackUserId: string | null,
  ) {
    if (!linkState.present) return

    const { error: deleteError } = await this.supabase.from("user_invoice_orders").delete().eq("invoice_id", invoiceId)

    if (deleteError) {
      throw new Error(`Failed to clear invoice ${remonlineInvoiceId} order links: ${deleteError.message}`)
    }

    if (linkState.orderIds.length === 0) return

    const { data: orders, error: ordersError } = await this.supabase
      .from("user_repair_orders")
      .select("id, remonline_order_id, user_id")
      .in("remonline_order_id", linkState.orderIds)

    if (ordersError) {
      throw new Error(`Failed to read linked orders for invoice ${remonlineInvoiceId}: ${ordersError.message}`)
    }

    const ordersByRemonlineId = new Map<number, JsonRecord>(
      (orders || []).map((order: JsonRecord) => [Number(order.remonline_order_id), order]),
    )
    const now = new Date().toISOString()
    const rows = linkState.orderIds.map((remonlineOrderId) => {
      const order = ordersByRemonlineId.get(remonlineOrderId)

      return {
        invoice_id: invoiceId,
        remonline_invoice_id: remonlineInvoiceId,
        order_id: order?.id ?? null,
        remonline_order_id: remonlineOrderId,
        user_id: order?.user_id ?? fallbackUserId,
        raw_payload: rawPayload,
        updated_at: now,
      }
    })

    const { error: insertError } = await this.supabase.from("user_invoice_orders").insert(rows)

    if (insertError) {
      throw new Error(`Failed to store invoice ${remonlineInvoiceId} order links: ${insertError.message}`)
    }
  }

  async upsertInvoiceFromPayload(input: JsonRecord, options: InvoicePayloadOptions = {}) {
    const source = options.source ?? "webhook"
    const invoice = extractInvoicePayload(input)
    const ownerId = extractClientId(invoice) ?? extractPayerId(invoice)
    const userId = await this.findUserId(ownerId)
    const normalized = normalizeInvoicePayload(input, userId, source)
    const existing = await this.findExistingInvoice(normalized.remonline_invoice_id)
    const preserveIfExisting = existing && !hasInvoiceNumber(input) ? ["invoice_number"] : []
    const row = mergeInvoiceForUpsert(normalized, existing, { preserveIfExisting })
    const linkState = extractInvoiceOrderLinkState(input)

    const { data, error } = await this.supabase
      .from("user_invoices")
      .upsert(row, { onConflict: "remonline_invoice_id" })
      .select("id, remonline_invoice_id, invoice_number, user_id, sync_source, sync_status")
      .single()

    if (error) {
      throw new Error(`Failed to upsert invoice ${row.remonline_invoice_id}: ${error.message}`)
    }

    await this.syncInvoiceOrderLinks(data.id, row.remonline_invoice_id, linkState, input, data.user_id ?? row.user_id)

    return data
  }

  async markInvoiceDeleted(remonlineInvoiceId: number) {
    const { data, error } = await this.supabase
      .from("user_invoices")
      .update({
        is_deleted: true,
        sync_status: "synced",
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("remonline_invoice_id", remonlineInvoiceId)
      .select("id, remonline_invoice_id, invoice_number, is_deleted, sync_status")
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to mark invoice ${remonlineInvoiceId} as deleted: ${error.message}`)
    }

    return data ?? null
  }
}
