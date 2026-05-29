import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

const source = () => readFile(new URL("../scripts/add-remonline-account-sync-fields.sql", import.meta.url), "utf8")

test("RemOnline account sync migration adds contact type and sync tracking fields", async () => {
  const sql = await source()

  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_contact_type/i)
  assert.match(sql, /remonline_contact_type[\s\S]*CHECK[\s\S]*'person'[\s\S]*'organization'/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_status/i)
  assert.match(sql, /remonline_sync_status[\s\S]*CHECK[\s\S]*'pending'[\s\S]*'synced'[\s\S]*'error'/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_error/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_synced_at/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_attempts/i)
  assert.match(sql, /idx_users_remonline_sync_status/i)
})
