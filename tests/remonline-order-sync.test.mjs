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
