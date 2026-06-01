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

test("order sync issue migration stores webhook recovery state", async () => {
  const sql = await read("../scripts/create-remonline-order-sync-issues-table.sql")

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.remonline_order_sync_issues/)
  assert.match(sql, /remonline_event_id TEXT NOT NULL/)
  assert.match(sql, /event_name TEXT NOT NULL/)
  assert.match(sql, /remonline_order_id INTEGER/)
  assert.match(sql, /remonline_client_id INTEGER/)
  assert.match(sql, /status TEXT NOT NULL DEFAULT 'open'/)
  assert.match(sql, /CHECK \(status IN \('open', 'resolved', 'ignored'\)\)/)
  assert.match(sql, /reason TEXT NOT NULL/)
  assert.match(sql, /raw_payload JSONB NOT NULL DEFAULT '\{\}'::jsonb/)
  assert.match(sql, /attempts INTEGER NOT NULL DEFAULT 1/)
  assert.match(sql, /resolved_by UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /ignored_by UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /idx_remonline_order_sync_issues_status/)
  assert.match(sql, /idx_remonline_order_sync_issues_order_id/)
  assert.match(sql, /FOR ALL TO service_role USING \(true\) WITH CHECK \(true\)/)
})

test("order sync issue service records, resolves, ignores, and lists issues", async () => {
  const servicePath = "../lib/services/remonline-order-sync-issues.ts"
  assert.equal(await pathExists(servicePath), true)

  const service = await read(servicePath)

  assert.match(service, /export async function recordOrderSyncIssue/)
  assert.match(service, /export async function resolveOrderSyncIssues/)
  assert.match(service, /export async function ignoreOrderSyncIssue/)
  assert.match(service, /export async function listOrderSyncIssues/)
  assert.match(service, /\.from\(["']remonline_order_sync_issues["']\)/)
  assert.match(service, /onConflict:\s*["']remonline_event_id["']/)
  assert.match(service, /attempts:\s*\(existingIssue\?\.attempts \|\| 0\) \+ 1/)
  assertDoesNotImportRemonlineApi(service)
})

test("order sync issue recording preserves terminal issue status on replay", async () => {
  const service = await read("../lib/services/remonline-order-sync-issues.ts")
  const recordStart = service.indexOf("export async function recordOrderSyncIssue")
  const recordEnd = service.indexOf("export async function resolveOrderSyncIssues")
  assert.notEqual(recordStart, -1)
  assert.notEqual(recordEnd, -1)

  const recordSource = service.slice(recordStart, recordEnd)

  assert.match(recordSource, /\.select\(["']id,\s*attempts,\s*status["']\)/)
  assert.match(recordSource, /status:\s*\(existingIssue\?\.status \|\| ["']open["']\) as OrderSyncIssueStatus/)
  assert.doesNotMatch(recordSource, /status:\s*["']open["'] as OrderSyncIssueStatus/)
  assert.doesNotMatch(recordSource, /resolved_at:\s*null/)
  assert.doesNotMatch(recordSource, /resolved_by:\s*null/)
  assert.doesNotMatch(recordSource, /ignored_at:\s*null/)
  assert.doesNotMatch(recordSource, /ignored_by:\s*null/)
})

test("order webhook handler records ignored order events without fetching RemOnline", async () => {
  const handler = await read("../app/api/webhooks/remonline/handlers/order-handler.ts")

  assert.match(handler, /recordOrderSyncIssue/)
  assert.match(handler, /Order not found in database/)
  assert.match(handler, /ignored:\s*true/)
  assert.match(handler, /status:\s*200/)
  assertDoesNotImportRemonlineApi(handler)
  assert.doesNotMatch(handler, /getOrderById|getOrderItems/)
})

test("manual order sync is admin-only and is the only order path that fetches full RemOnline data", async () => {
  const syncService = await read("../lib/services/remonline-order-sync.ts")
  const adminRoute = await read("../app/api/admin/remonline/orders/[id]/sync/route.ts")
  const apiClient = await read("../lib/api/remonline.ts")
  const orderService = await read("../app/api/webhooks/remonline/services/order-service.ts")
  const userOrdersRoute = await read("../app/api/user/repair-orders/route.ts")

  assert.match(syncService, /remonline\.getOrderById\(remonlineOrderId\)/)
  assert.match(syncService, /remonline\.getOrderItems\(remonlineOrderId\)/)
  assert.match(syncService, /resolveOrderSyncIssues\(remonlineOrderId/)
  assert.match(syncService, /upsertOrderFromRemonlineApi/)

  assert.match(adminRoute, /getSession/)
  assert.match(adminRoute, /session\.user\.role !== "admin"/)
  assert.match(adminRoute, /syncOrderFromRemonline/)
  assert.match(adminRoute, /Invalid order id/)

  assert.match(apiClient, /async getOrderById/)
  assert.match(apiClient, /async getOrderItems/)
  assert.match(orderService, /async upsertOrderFromRemonlineApi/)
  assert.match(orderService, /\.from\(["']user_repair_order_services["']\)\.delete\(\)\.eq\(["']order_id["'], orderDbId\)/)
  assert.match(orderService, /storeOrderServices\(orderDbId, remonlineOrderId, orderItems\)/)

  assertDoesNotImportRemonlineApi(userOrdersRoute)
  assert.doesNotMatch(userOrdersRoute, /getOrderById|getOrderItems|fetch\(/)
})

test("admin order sync issue APIs are admin-only", async () => {
  const listRoute = await read("../app/api/admin/remonline/order-sync-issues/route.ts")
  const issueRoute = await read("../app/api/admin/remonline/order-sync-issues/[id]/route.ts")

  assert.match(listRoute, /getSession/)
  assert.match(listRoute, /session\.user\.role !== "admin"/)
  assert.match(listRoute, /listOrderSyncIssues/)
  assert.match(issueRoute, /getSession/)
  assert.match(issueRoute, /session\.user\.role !== "admin"/)
  assert.match(issueRoute, /ignoreOrderSyncIssue/)
})
