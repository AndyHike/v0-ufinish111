import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import { InvoiceService } from "@/app/api/webhooks/remonline/services/invoice-service"

type JsonRecord = Record<string, any>

type SyncInvoiceResult = {
  success: boolean
  message?: string
  invoice?: any
}

type SyncInvoicesForOrderResult = {
  success: boolean
  message?: string
  invoiceIds: number[]
  invoices: any[]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error || "Failed to sync invoice")
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toIntegerId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value
  if (typeof value !== "string" || !value.trim()) return null

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null)
}

function addInvoiceId(invoiceIds: Set<number>, value: unknown) {
  const id = toIntegerId(value)
  if (id) invoiceIds.add(id)
}

function recordLooksLikeInvoice(record: JsonRecord) {
  const type = String(
    firstPresent(record.type, record.object_type, record.objectType, record.document_type, record.documentType, ""),
  ).toLowerCase()

  return /invoice|bill/.test(type)
}

function collectInvoiceIds(value: unknown, invoiceIds: Set<number>, invoiceContext = false) {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (invoiceContext && !isRecord(item) && !Array.isArray(item)) {
        addInvoiceId(invoiceIds, item)
      } else {
        collectInvoiceIds(item, invoiceIds, invoiceContext)
      }
    }
    return
  }

  if (!isRecord(value)) {
    if (invoiceContext) addInvoiceId(invoiceIds, value)
    return
  }

  const currentIsInvoice = invoiceContext || recordLooksLikeInvoice(value)

  if (currentIsInvoice) {
    addInvoiceId(invoiceIds, firstPresent(value.id, value.object_id, value.objectId, value.document_id, value.documentId))
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const keyIsInvoice = /invoice|bill/i.test(key)
    const keyIsInvoiceId =
      /(^|[_-])(invoice|bill)([_-]?(id|ids))?$/i.test(key) ||
      /^(invoiceId|invoiceIds|billId|billIds|remonlineInvoiceId|remonlineInvoiceIds)$/i.test(key)
    const nestedIsContainer = isRecord(nestedValue) || Array.isArray(nestedValue)

    if (keyIsInvoiceId) {
      collectInvoiceIds(nestedValue, invoiceIds, true)
      continue
    }

    collectInvoiceIds(nestedValue, invoiceIds, keyIsInvoice && nestedIsContainer)
  }
}

export function extractInvoiceIdsFromOrderPayload(order: any): number[] {
  const invoiceIds = new Set<number>()
  collectInvoiceIds(order, invoiceIds)
  return [...invoiceIds]
}

export async function syncInvoiceFromRemonline(remonlineInvoiceId: number): Promise<SyncInvoiceResult> {
  try {
    const result = await remonline.getInvoiceById(remonlineInvoiceId)

    if (!result.success || !result.invoice) {
      return {
        success: false,
        message: result.message || "Failed to fetch invoice from RemOnline",
      }
    }

    const supabase = createClient()
    const invoiceService = new InvoiceService(supabase)
    const invoice = await invoiceService.upsertInvoiceFromPayload({ invoice: result.invoice }, { source: "manual" })

    return {
      success: true,
      invoice,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}

export async function syncInvoicesForRemonlineOrder(remonlineOrderId: number): Promise<SyncInvoicesForOrderResult> {
  try {
    const orderResult = await remonline.getOrderById(remonlineOrderId)

    if (!orderResult.success || !orderResult.order) {
      return {
        success: false,
        message: orderResult.message || "Failed to fetch order from RemOnline",
        invoiceIds: [],
        invoices: [],
      }
    }

    const order = orderResult.order
    const invoiceIds = extractInvoiceIdsFromOrderPayload(order)

    if (invoiceIds.length === 0) {
      return {
        success: true,
        message: "No linked invoice ids found in RemOnline order payload",
        invoiceIds,
        invoices: [],
      }
    }

    const supabase = createClient()
    const { data: localOrder } = await supabase
      .from("user_repair_orders")
      .select("id, user_id")
      .eq("remonline_order_id", remonlineOrderId)
      .maybeSingle()

    const invoiceService = new InvoiceService(supabase)
    const invoices = []
    const failures = []

    for (const invoiceId of invoiceIds) {
      const invoiceResult = await remonline.getInvoiceById(invoiceId)

      if (!invoiceResult.success || !invoiceResult.invoice) {
        failures.push(`${invoiceId}: ${invoiceResult.message || "Invoice not found"}`)
        continue
      }

      const invoice = await invoiceService.upsertInvoiceFromPayload(
        {
          invoice: invoiceResult.invoice,
          metadata: { order: { id: remonlineOrderId } },
        },
        { source: "webhook", fallbackUserId: localOrder?.user_id ?? null },
      )
      invoices.push(invoice)
    }

    if (failures.length > 0) {
      return {
        success: false,
        message: `Failed to sync linked invoices: ${failures.join("; ")}`,
        invoiceIds,
        invoices,
      }
    }

    return {
      success: true,
      invoiceIds,
      invoices,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
      invoiceIds: [],
      invoices: [],
    }
  }
}
