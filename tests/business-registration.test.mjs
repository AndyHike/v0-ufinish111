import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

test("business billing migration adds company and billing address fields", async () => {
  const source = await read("../scripts/add-business-billing-fields.sql")

  assert.match(source, /ALTER TABLE users ADD COLUMN company_name/i)
  assert.match(source, /ALTER TABLE profiles ADD COLUMN billing_street/i)
  assert.match(source, /ALTER TABLE profiles ADD COLUMN billing_city/i)
  assert.match(source, /ALTER TABLE profiles ADD COLUMN billing_postal_code/i)
  assert.match(source, /ALTER TABLE profiles ADD COLUMN billing_country/i)
})

test("ARES company API validates ICO and normalizes company details", async () => {
  const source = await read("../app/api/ares/company/route.ts")

  assert.match(source, /https:\/\/ares\.gov\.cz\/ekonomicke-subjekty-v-be\/rest\/ekonomicke-subjekty/)
  assert.match(source, /\^\\d\{8\}\$/)
  assert.match(source, /obchodniJmeno/)
  assert.match(source, /dic/)
  assert.match(source, /sidlo/)
  assert.match(source, /textovaAdresa/)
  assert.match(source, /billingStreet/)
  assert.match(source, /billingCity/)
  assert.match(source, /billingPostalCode/)
})

test("business registration form starts with ICO lookup and treats DIC as optional", async () => {
  const source = await read("../app/[locale]/auth/register/register-client.tsx")
  const icoPosition = source.indexOf('id="ico"')
  const firstNamePosition = source.indexOf('id="firstName"')

  assert.ok(icoPosition > -1, "ICO field exists")
  assert.ok(firstNamePosition > -1, "first name field exists")
  assert.ok(icoPosition < firstNamePosition, "ICO is shown before personal fields")
  assert.match(source, /handleAresLookup/)
  assert.match(source, /\/api\/ares\/company/)
  assert.match(source, /companyName/)
  assert.match(source, /billingStreet/)
  assert.match(source, /billingCity/)
  assert.match(source, /billingPostalCode/)
  assert.doesNotMatch(source, /path:\s*\["dic"\]/)
})

test("registration persistence stores company and billing address fields", async () => {
  const source = await read("../app/actions/auth-api.ts")

  assert.match(source, /companyName/)
  assert.match(source, /company_name/)
  assert.match(source, /billingStreet/)
  assert.match(source, /billing_street/)
  assert.match(source, /billingCity/)
  assert.match(source, /billing_city/)
  assert.match(source, /billingPostalCode/)
  assert.match(source, /billing_postal_code/)
  assert.match(source, /billingCountry/)
  assert.match(source, /billing_country/)
})

test("admin users API exposes company and billing address fields", async () => {
  const listSource = await read("../app/api/admin/users/route.ts")
  const detailSource = await read("../app/api/admin/users/[id]/route.ts")

  for (const source of [listSource, detailSource]) {
    assert.match(source, /company_name/)
    assert.match(source, /billing_street/)
    assert.match(source, /billing_city/)
    assert.match(source, /billing_postal_code/)
    assert.match(source, /billing_country/)
  }
})
