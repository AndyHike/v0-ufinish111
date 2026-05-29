import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function source() {
  return readFile(new URL("../components/admin/users-management.tsx", import.meta.url), "utf8")
}

test("admin users table shows RemOnline sync state and retry action", async () => {
  const text = await source()

  assert.match(text, /remonline_id/)
  assert.match(text, /remonline_sync_status/)
  assert.match(text, /remonline_contact_type/)
  assert.match(text, /remonline_sync_error/)
  assert.match(text, /handleSyncRemonline/)
  assert.match(text, /\/api\/admin\/users\/\$\{userId\}\/remonline-sync/)
  assert.match(text, /getRemonlineBadge/)
  assert.match(text, /Sync RemOnline/)
})
