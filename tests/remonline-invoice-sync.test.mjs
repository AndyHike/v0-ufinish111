import { readFile, stat } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

async function pathExists(path) {
  try {
    await stat(new URL(path, import.meta.url))
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

function assertDoesNotImportRemonlineApi(source) {
  assert.doesNotMatch(source, /from\s+["'][^"']*lib\/api\/remonline["']/)
}

test("invoice migration stores local invoice data and sync state", async () => {
  const sql = await read("../scripts/create-user-invoices-table.sql")

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_invoices/)
  assert.match(sql, /remonline_invoice_id INTEGER UNIQUE NOT NULL/)
  assert.match(sql, /user_id UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /invoice_number TEXT NOT NULL/)
  assert.match(sql, /client_id INTEGER/)
  assert.match(sql, /payer_id INTEGER/)
  assert.match(sql, /issue_date TIMESTAMP WITH TIME ZONE/)
  assert.match(sql, /due_date TIMESTAMP WITH TIME ZONE/)
  assert.match(sql, /total_amount NUMERIC\(12,2\)/)
  assert.match(sql, /raw_payload JSONB NOT NULL DEFAULT '\{\}'::jsonb/)
  assert.match(sql, /sync_source TEXT NOT NULL DEFAULT 'webhook'/)
  assert.match(sql, /sync_status TEXT NOT NULL DEFAULT 'synced'/)
  assert.match(sql, /is_deleted BOOLEAN NOT NULL DEFAULT FALSE/)
  assert.match(sql, /idx_user_invoices_user_id/)
  assert.match(sql, /idx_user_invoices_remonline_invoice_id/)
  assert.match(sql, /idx_user_invoices_client_id/)
  assert.match(sql, /Users can view their own invoices/)
})

test("invoice order link migration supports one invoice connected to multiple orders", async () => {
  const migrationPath = "../scripts/create-user-invoice-orders-table.sql"
  assert.equal(await pathExists(migrationPath), true)

  const sql = await read(migrationPath)

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_invoice_orders/)
  assert.match(sql, /invoice_id UUID NOT NULL REFERENCES public\.user_invoices\(id\) ON DELETE CASCADE/)
  assert.match(sql, /remonline_invoice_id INTEGER NOT NULL/)
  assert.match(sql, /order_id UUID REFERENCES public\.user_repair_orders\(id\) ON DELETE SET NULL/)
  assert.match(sql, /remonline_order_id INTEGER NOT NULL/)
  assert.match(sql, /user_id UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /UNIQUE \(remonline_invoice_id, remonline_order_id\)/)
  assert.match(sql, /idx_user_invoice_orders_invoice_id/)
  assert.match(sql, /idx_user_invoice_orders_order_id/)
  assert.match(sql, /idx_user_invoice_orders_remonline_order_id/)
  assert.match(sql, /Users can view their own invoice order links/)
  assert.match(sql, /Service can manage invoice order links/)
})

test("invoice webhook route is canonical and routes invoice events after signature verification", async () => {
  const route = await read("../app/api/webhooks/remonline/route.ts")

  assert.match(route, /REMONLINE_WEBHOOK_SECRET/)
  assert.match(route, /verifyRemonlineWebhookSignature/)
  assert.match(route, /handleInvoiceEvents/)
  assert.match(route, /eventType\.startsWith\("Invoice\."\)/)
  assert.ok(route.indexOf("verifyRemonlineWebhookSignature({ payload") < route.indexOf("handleInvoiceEvents("))
})

test("sparse order webhook fallback is signed and payload-first", async () => {
  const route = await read("../app/api/webhooks/remonline/route.ts")
  const signatureIndex = route.indexOf("verifyRemonlineWebhookSignature({ payload")
  const fallbackIndex = route.indexOf('eventType.startsWith("Order.")')

  assert.notEqual(signatureIndex, -1)
  assert.notEqual(fallbackIndex, -1)
  assert.ok(signatureIndex < fallbackIndex)
  assert.match(route, /if\s*\([\s\S]*eventType\.startsWith\("Order\."\)[\s\S]*payload\.context\?\.object_id != null[\s\S]*handleOrderEvents\(payload\)/)
})

test("signed sparse and unsupported webhooks are acknowledged instead of disabling RO App webhook", async () => {
  const route = await read("../app/api/webhooks/remonline/route.ts")
  const orderHandler = await read("../app/api/webhooks/remonline/handlers/order-handler.ts")
  const clientHandler = await read("../app/api/webhooks/remonline/handlers/client-handler.ts")
  const invoiceHandler = await read("../app/api/webhooks/remonline/handlers/invoice-handler.ts")

  const signatureIndex = route.indexOf("verifyRemonlineWebhookSignature({ payload")
  const clientFallbackIndex = route.indexOf("Validation failed but trying to process sparse Client webhook anyway")
  const signedFallbackIndex = route.indexOf("Signed webhook received but no local action was taken")

  assert.notEqual(signatureIndex, -1)
  assert.ok(signatureIndex < clientFallbackIndex)
  assert.ok(signatureIndex < signedFallbackIndex)
  assert.match(route, /eventType\.startsWith\("Client\."\)/)
  assert.match(route, /status:\s*200/)

  assert.match(orderHandler, /recordOrderSyncIssue/)
  assert.match(orderHandler, /ignored:\s*true/)
  assert.match(orderHandler, /Order not found in database/)
  assert.match(orderHandler, /status:\s*200/)

  assert.match(clientHandler, /clientWebhookProcessingErrorResponse/)
  assert.match(clientHandler, /ignored:\s*true/)
  assert.match(clientHandler, /status:\s*200/)

  assert.match(invoiceHandler, /invoiceWebhookIgnoredResponse/)
  assert.match(invoiceHandler, /ignored:\s*true/)
  assert.match(invoiceHandler, /status:\s*200/)
})

test("signed webhook handler processing errors are acknowledged with 200", async () => {
  const handlers = [
    await read("../app/api/webhooks/remonline/handlers/order-handler.ts"),
    await read("../app/api/webhooks/remonline/handlers/client-handler.ts"),
    await read("../app/api/webhooks/remonline/handlers/invoice-handler.ts"),
  ]

  for (const handler of handlers) {
    assert.doesNotMatch(handler, /status:\s*500/)
  }
})

test("invoice webhook handler is payload-first and never imports the RO App API client", async () => {
  const handlerPath = "../app/api/webhooks/remonline/handlers/invoice-handler.ts"
  assert.equal(await pathExists(handlerPath), true)

  const handler = await read(handlerPath)

  assert.match(handler, /export async function handleInvoiceEvents/)
  assert.match(handler, /Invoice\.Created/)
  assert.match(handler, /Invoice\.Deleted/)
  assert.match(handler, /Invoice\.Updated/)
  assert.match(handler, /upsertInvoiceFromPayload/)
  assert.match(handler, /markInvoiceDeleted/)
  assertDoesNotImportRemonlineApi(handler)
  assert.doesNotMatch(handler, /getInvoiceById/)
  assert.doesNotMatch(handler, /makeRequest/)
  assert.doesNotMatch(handler, /makeRoAppRequest/)
})

test("invoice service preserves payload-first boundaries", async () => {
  const service = await read("../app/api/webhooks/remonline/services/invoice-service.ts")

  assert.match(service, /export function normalizeInvoicePayload/)
  assert.match(service, /export class InvoiceService/)
  assert.match(service, /async upsertInvoiceFromPayload/)
  assert.match(service, /async markInvoiceDeleted/)
  assert.match(service, /raw_payload/)
  assert.match(service, /sync_source/)
  assert.match(service, /metadata\?\.payer/)
  assert.match(service, /metadata\?\.manager/)
  assert.match(service, /metadata\?\.client/)
  assert.match(service, /extractClientId\(invoice\) \?\? extractPayerId\(invoice\)/)
  assertDoesNotImportRemonlineApi(service)
  assert.doesNotMatch(service, /getInvoiceById/)
  assert.doesNotMatch(service, /fetch\(/)
})

test("invoice service synchronizes linked orders from webhook and manual payloads", async () => {
  const service = await read("../app/api/webhooks/remonline/services/invoice-service.ts")

  assert.match(service, /function extractInvoiceOrderLinkState/)
  assert.match(service, /async syncInvoiceOrderLinks/)
  assert.match(service, /linkState\.present/)
  assert.match(service, /invoice\.orders/)
  assert.match(service, /invoice\.order_ids/)
  assert.match(service, /invoice\.documents/)
  assert.match(service, /\.from\(["']user_repair_orders["']\)/)
  assert.match(service, /\.from\(["']user_invoice_orders["']\)/)
  assert.match(service, /\.delete\(\)\.eq\(["']invoice_id["'], invoiceId\)/)
  assert.match(service, /\.insert\(rows\)/)
  assert.match(service, /remonline_invoice_id:\s*remonlineInvoiceId/)
  assert.match(service, /remonline_order_id:\s*remonlineOrderId/)
  assertDoesNotImportRemonlineApi(service)
})

test("invoice service can use an order owner fallback when invoice has no owner fields", async () => {
  const service = await read("../app/api/webhooks/remonline/services/invoice-service.ts")

  assert.match(service, /fallbackUserId\?: string \| null/)
  assert.match(service, /const resolvedUserId = await this\.findUserId\(ownerId\)/)
  assert.match(service, /const userId = resolvedUserId \?\? options\.fallbackUserId \?\? null/)
  assert.match(service, /syncInvoiceOrderLinks\(data\.id, row\.remonline_invoice_id, linkState, input, data\.user_id \?\? row\.user_id\)/)
})

test("manual and order-driven invoice sync are the only invoice paths that call RO App API", async () => {
  const syncService = await read("../lib/services/remonline-invoice-sync.ts")
  const adminRoute = await read("../app/api/admin/remonline/invoices/[id]/sync/route.ts")
  const apiClient = await read("../lib/api/remonline.ts")

  assert.match(syncService, /remonline\.getInvoiceById\(remonlineInvoiceId\)/)
  assert.match(syncService, /remonline\.getInvoiceById\(invoiceId\)/)
  assert.match(syncService, /syncInvoicesForRemonlineOrder/)
  assert.match(syncService, /new InvoiceService\(supabase\)/)
  assert.match(syncService, /source:\s*["']manual["']/)
  assert.match(adminRoute, /getSession/)
  assert.match(adminRoute, /session\.user\.role !== "admin"/)
  assert.match(adminRoute, /syncInvoiceFromRemonline/)
  assert.match(apiClient, /async getInvoiceById/)
  assert.match(apiClient, /\/invoices\?/)
})

test("user invoice endpoint reads local database only", async () => {
  const route = await read("../app/api/user/invoices/route.ts")

  assert.match(route, /getSession/)
  assert.match(route, /\.from\(["']user_invoices["']\)/)
  assert.match(route, /\.from\(["']user_invoice_orders["']\)/)
  assert.match(route, /\.from\(["']user_repair_orders["']\)/)
  assert.match(route, /\.eq\("user_id", userId\)/)
  assert.match(route, /\.eq\("is_deleted", false\)/)
  assert.match(route, /ordersByInvoiceId/)
  assert.match(route, /orders:\s*ordersByInvoiceId\.get\(invoice\.id\) \|\| \[\]/)
  assertDoesNotImportRemonlineApi(route)
  assert.doesNotMatch(route, /getInvoiceById/)
  assert.doesNotMatch(route, /fetch\(/)
})

test("existing order created and updated webhooks are also payload-first", async () => {
  const handler = await read("../app/api/webhooks/remonline/handlers/order-handler.ts")
  const service = await read("../app/api/webhooks/remonline/services/order-service.ts")

  assertDoesNotImportRemonlineApi(handler)
  assert.doesNotMatch(handler, /getOrderById/)
  assert.doesNotMatch(handler, /getOrderItems/)
  assert.match(handler, /upsertOrderFromWebhookPayload/)
  assert.match(service, /async upsertOrderFromWebhookPayload/)
})
