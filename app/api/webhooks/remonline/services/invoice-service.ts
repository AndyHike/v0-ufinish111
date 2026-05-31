type InvoiceSyncSource = "webhook" | "manual"

type InvoicePayloadOptions = {
  source?: InvoiceSyncSource
}

type JsonRecord = Record<string, any>

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

function extractInvoicePayload(input: JsonRecord): JsonRecord {
  const metadataInvoice = input.metadata?.invoice
  if (isRecord(metadataInvoice)) return metadataInvoice

  const directInvoice = input.invoice
  if (isRecord(directInvoice)) return directInvoice

  const data = input.data
  if (isRecord(data)) return data

  return input
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

function mergeInvoiceForUpsert(normalized: JsonRecord, existing: JsonRecord | null) {
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

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [
      key,
      alwaysFreshFields.has(key) || (value !== null && value !== undefined) ? value : existing[key],
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

  async upsertInvoiceFromPayload(input: JsonRecord, options: InvoicePayloadOptions = {}) {
    const source = options.source ?? "webhook"
    const invoice = extractInvoicePayload(input)
    const clientId = extractClientId(invoice)
    const userId = await this.findUserId(clientId)
    const normalized = normalizeInvoicePayload(input, userId, source)
    const existing = await this.findExistingInvoice(normalized.remonline_invoice_id)
    const row = mergeInvoiceForUpsert(normalized, existing)

    const { data, error } = await this.supabase
      .from("user_invoices")
      .upsert(row, { onConflict: "remonline_invoice_id" })
      .select("id, remonline_invoice_id, invoice_number, user_id, sync_source, sync_status")
      .single()

    if (error) {
      throw new Error(`Failed to upsert invoice ${row.remonline_invoice_id}: ${error.message}`)
    }

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
