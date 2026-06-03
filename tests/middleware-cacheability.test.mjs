import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("localized public pages do not set locale cookies on cacheable pass-through responses", async () => {
  const source = await readFile(new URL("../middleware.ts", import.meta.url), "utf8")
  const localeCheckIndex = source.indexOf("const locale = pathname.split")
  const authChecksIndex = source.indexOf("// Auth checks for protected routes")

  assert.notEqual(localeCheckIndex, -1)
  assert.notEqual(authChecksIndex, -1)

  const localizedPassThroughSource = source.slice(localeCheckIndex, authChecksIndex)

  assert.doesNotMatch(localizedPassThroughSource, /cookies\.set\("NEXT_LOCALE"/)
})
