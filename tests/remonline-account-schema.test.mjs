import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

const source = () => readFile(new URL("../scripts/add-remonline-account-sync-fields.sql", import.meta.url), "utf8")

const guardedColumn = (column) =>
  new RegExp(
    `IF NOT EXISTS\\s*\\([\\s\\S]*?information_schema\\.columns[\\s\\S]*?table_schema\\s*=\\s*'public'[\\s\\S]*?table_name\\s*=\\s*'users'[\\s\\S]*?column_name\\s*=\\s*'${column}'[\\s\\S]*?\\)\\s*THEN[\\s\\S]*?ALTER TABLE public\\.users\\s+ADD COLUMN ${column}`,
    "i",
  )

test("RemOnline account sync migration adds contact type and sync tracking fields", async () => {
  const sql = await source()

  assert.match(sql, /ALTER TABLE public\.users\s+ADD COLUMN remonline_contact_type/i)
  assert.match(sql, /remonline_contact_type[\s\S]*CHECK[\s\S]*'person'[\s\S]*'organization'/i)
  assert.match(sql, /ALTER TABLE public\.users\s+ADD COLUMN remonline_sync_status/i)
  assert.match(sql, /remonline_sync_status[\s\S]*CHECK[\s\S]*'pending'[\s\S]*'synced'[\s\S]*'error'/i)
  assert.match(sql, /ALTER TABLE public\.users\s+ADD COLUMN remonline_sync_error/i)
  assert.match(sql, /ALTER TABLE public\.users\s+ADD COLUMN remonline_synced_at/i)
  assert.match(sql, /ALTER TABLE public\.users\s+ADD COLUMN remonline_sync_attempts/i)
  assert.match(sql, /remonline_sync_attempts[\s\S]*CHECK\s*\(\s*remonline_sync_attempts\s*>=\s*0\s*\)/i)
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_users_remonline_sync_status ON public\.users\(remonline_sync_status\)/i)
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_users_remonline_contact_type ON public\.users\(remonline_contact_type\)/i)
  assert.match(sql, guardedColumn("remonline_contact_type"))
  assert.match(sql, guardedColumn("remonline_sync_status"))
  assert.match(sql, guardedColumn("remonline_sync_error"))
  assert.match(sql, guardedColumn("remonline_synced_at"))
  assert.match(sql, guardedColumn("remonline_sync_attempts"))
  assert.match(sql, /UPDATE public\.users[\s\S]*remonline_contact_type = 'person'[\s\S]*remonline_sync_status = 'synced'/i)
  assert.match(sql, /WHERE remonline_id IS NOT NULL[\s\S]*COALESCE\(is_b2b, false\) = false/i)
})
