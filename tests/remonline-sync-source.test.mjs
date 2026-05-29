import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

test("RemOnline sync service syncs one local user and writes sync state", async () => {
  const source = await read("../lib/services/remonline-sync.ts")

  assert.match(source, /export async function syncUserToRemonline/)
  assert.match(source, /buildRemonlineContactPayload/)
  assert.match(source, /remonline_sync_status:\s*"pending"/)
  assert.match(source, /remonline_sync_status:\s*"synced"/)
  assert.match(source, /remonline_sync_status:\s*"error"/)
  assert.match(source, /remonline_contact_type/)
  assert.match(source, /remonline_sync_error/)
  assert.match(source, /remonline_synced_at/)
  assert.match(source, /remonline_sync_attempts/)
  assert.match(source, /profiles!left\(phone, address, billing_street, billing_city, billing_postal_code, billing_country\)/)
  assert.match(source, /createOrganization|updateOrganization/)
  assert.match(source, /createPerson|updatePerson/)
})

test("admin manual RemOnline sync endpoint checks admin session and syncs requested user", async () => {
  const route = await read("../app/api/admin/users/[id]/remonline-sync/route.ts")

  assert.match(route, /getSession/)
  assert.match(route, /session\.user\.role !== "admin"/)
  assert.match(route, /syncUserToRemonline\(id\)/)
  assert.match(route, /export async function POST/)
})
