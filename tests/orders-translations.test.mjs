import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const locales = ["uk", "en", "cs"]
const requiredOrderKeys = ["noOrders", "noOrdersDescription", "noOrdersFound", "noOrdersFoundDescription"]

test("profile orders empty-state translations exist in every locale", async () => {
  for (const locale of locales) {
    const messages = JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"))

    for (const key of requiredOrderKeys) {
      assert.equal(typeof messages.orders?.[key], "string", `${locale}.orders.${key} is missing`)
      assert.ok(messages.orders[key].trim().length > 0, `${locale}.orders.${key} is empty`)
    }
  }
})
