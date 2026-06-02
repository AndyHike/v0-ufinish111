import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

function extractFunction(source, name) {
  const start = source.indexOf(`export async function ${name}`)
  assert.notEqual(start, -1, `${name} function is missing`)

  const next = source.indexOf("\nexport async function ", start + 1)
  return source.slice(start, next === -1 ? source.length : next)
}

test("admin discounts API lists all discounts, not only currently active discounts", async () => {
  const route = await read("../app/api/admin/discounts/route.ts")
  const queries = await read("../lib/discounts/queries.ts")
  const listFunction = extractFunction(queries, "getAllDiscounts")

  assert.match(route, /getAllDiscounts/)
  assert.doesNotMatch(route, /getActiveDiscounts/)
  assert.match(listFunction, /\.from\(["']discounts["']\)/)
  assert.doesNotMatch(listFunction, /\.eq\(["']is_active["'],\s*true\)/)
  assert.doesNotMatch(listFunction, /starts_at\.lte/)
  assert.doesNotMatch(listFunction, /expires_at\.gt/)
})

test("discount updates persist every editable field from the form", async () => {
  const queries = await read("../lib/discounts/queries.ts")
  const updateFunction = extractFunction(queries, "updateDiscount")

  for (const [field, column] of [
    ["code", "code"],
    ["discountType", "discount_type"],
    ["discountValue", "discount_value"],
    ["serviceIds", "service_ids"],
    ["scopeType", "scope_type"],
    ["brandId", "brand_id"],
    ["seriesId", "series_id"],
    ["modelId", "model_id"],
    ["isActive", "is_active"],
    ["startsAt", "starts_at"],
    ["expiresAt", "expires_at"],
    ["maxUses", "max_uses"],
    ["maxUsesPerUser", "max_uses_per_user"],
    ["userId", "user_id"],
  ]) {
    assert.match(updateFunction, new RegExp(`updates\\.${field} !== undefined[\\s\\S]*updateData\\.${column}`))
  }
})

test("discount form supports global or personal discounts and validates scoped selections", async () => {
  const form = await read("../components/admin/discount-form.tsx")

  assert.match(form, /type AdminUser/)
  assert.match(form, /fetchUsers/)
  assert.match(form, /\/api\/admin\/users\?/)
  assert.match(form, /CommandItem[\s\S]*value=["']global["']/)
  assert.match(form, /formData\.userId === ["']global["'] \? null : formData\.userId/)
  assert.match(form, /scopeType === ["']brand["'][\s\S]*!formData\.brandId/)
  assert.match(form, /scopeType === ["']series["'][\s\S]*!formData\.seriesId/)
  assert.match(form, /scopeType === ["']model["'][\s\S]*!formData\.modelId/)
  assert.doesNotMatch(form, /value=["']all_series["']/)
})

test("admin users API used by personal discounts is admin-only", async () => {
  const usersRoute = await read("../app/api/admin/users/route.ts")

  assert.match(usersRoute, /getSession/)
  assert.match(usersRoute, /session\.user\.role !== ["']admin["']/)
  assert.match(usersRoute, /Unauthorized/)
  assert.match(usersRoute, /phoneProfiles/)
  assert.match(usersRoute, /profiles"\)\.select\("id"\)\.ilike\("phone"/)
  assert.match(usersRoute, /id\.eq/)
})

test("admin discounts API validates create payload before inserting", async () => {
  const route = await read("../app/api/admin/discounts/route.ts")

  assert.match(route, /function normalizeDiscountPayload/)
  assert.match(route, /String\(body\.code \?\? ""\)\.trim\(\)\.toUpperCase\(\)/)
  assert.match(route, /serviceIds\.length === 0/)
  assert.match(route, /return NextResponse\.json\(\{ error: validation\.error \}, \{ status: 400 \}\)/)
  assert.match(route, /isDuplicateDiscountCodeError/)
  assert.match(route, /status: isDuplicateDiscountCodeError\(details\) \? 409 : 500/)
  assert.doesNotMatch(route, /body\.code\.toUpperCase\(\)/)
})

test("admin discounts page shows API error details from failed creates", async () => {
  const page = await read("../app/[locale]/admin/discounts/page.tsx")

  assert.match(page, /const errorPayload = await response\.json\(\)\.catch/)
  assert.match(page, /errorPayload\?\.details \|\| errorPayload\?\.error \|\|/)
  assert.match(page, /setCreateError\(message\)/)
})

test("discount form uses searchable personal user picker", async () => {
  const form = await read("../components/admin/discount-form.tsx")

  assert.match(form, /CommandInput/)
  assert.match(form, /PopoverTrigger/)
  assert.match(form, /function getUserSearchText/)
  assert.match(form, /user\.phone/)
  assert.match(form, /user\.id/)
  assert.match(form, /filteredUsers/)
  assert.doesNotMatch(form, /<Select value=\{formData\.userId\}/)
})
