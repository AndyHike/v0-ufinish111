import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function source() {
  return readFile(new URL("../components/admin/users-management.tsx", import.meta.url), "utf8")
}

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
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

test("admin create and edit dialogs expose company identity and billing address fields", async () => {
  const text = await source()

  for (const field of [
    "is_b2b",
    "company_name",
    "ico",
    "dic",
    "billing_street",
    "billing_city",
    "billing_postal_code",
    "billing_country",
  ]) {
    assert.match(text, new RegExp(`${field}: "create_${field}"`))
    assert.match(text, new RegExp(`${field}: "edit_${field}"`))
    assert.match(text, new RegExp(`id=\\{ids\\.${field}\\}`))
  }

  assert.match(text, /@\/components\/ui\/switch/)
})

test("admin users menu can block and unblock account access", async () => {
  const text = await source()

  assert.match(text, /handleBlockUser/)
  assert.match(text, /is_approved:\s*false/)
  assert.match(text, /handleApproveUser\(user\.id\)/)
  assert.match(text, /handleBlockUser\(user\.id\)/)
})

test("admin users action menu remains reachable when the table is wider than the viewport", async () => {
  const text = await source()

  assert.match(text, /rounded-md border overflow-x-auto/)
  assert.match(text, /sticky right-0/)
  assert.match(text, /bg-background/)
  assert.match(text, /<TableCell className="sticky right-0[\s\S]*?<DropdownMenu>/)
  assert.match(text, /<TableCell>\s*<div className="flex items-center gap-3">\s*<Avatar/)
})

test("admin users page keeps the admin shell usable on narrow screens", async () => {
  const layout = await read("../app/[locale]/admin/layout.tsx")
  const sidebar = await read("../components/admin/admin-sidebar.tsx")
  const page = await read("../app/[locale]/admin/users/page.tsx")

  assert.match(layout, /flex min-h-screen flex-col md:flex-row/)
  assert.match(layout, /min-w-0 flex-1/)
  assert.match(sidebar, /w-full shrink-0[\s\S]*md:w-64/)
  assert.match(sidebar, /md:overflow-y-auto/)
  assert.match(sidebar, /overflow-x-auto/)
  assert.match(page, /p-4 md:p-8 md:pt-6/)
  assert.match(page, /getTranslations\(\{ locale, namespace: "Admin" \}\)/)
  assert.match(await source(), /flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between/)
})
