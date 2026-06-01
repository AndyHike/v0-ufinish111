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
  const fallbackIndex = route.indexOf('payload.event_name.startsWith("Order.")')

  assert.notEqual(signatureIndex, -1)
  assert.notEqual(fallbackIndex, -1)
  assert.ok(signatureIndex < fallbackIndex)
  assert.match(route, /if\s*\(\s*typeof payload\.event_name === "string"[\s\S]*payload\.event_name\.startsWith\("Order\."\)[\s\S]*payload\.context\?\.object_id != null[\s\S]*handleOrderEvents\(payload\)/)
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

test("manual invoice sync is the only invoice path that calls RO App API", async () => {
  const syncService = await read("../lib/services/remonline-invoice-sync.ts")
  const adminRoute = await read("../app/api/admin/remonline/invoices/[id]/sync/route.ts")
  const apiClient = await read("../lib/api/remonline.ts")

  assert.match(syncService, /remonline\.getInvoiceById\(remonlineInvoiceId\)/)
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
  assert.match(route, /\.eq\("user_id", userId\)/)
  assert.match(route, /\.eq\("is_deleted", false\)/)
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
