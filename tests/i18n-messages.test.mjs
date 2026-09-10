import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const LOCALES = ["cs", "en", "uk"]

function loadMessages(locale) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "messages", `${locale}.json`), "utf8"))
}

// Arrays are left as leaves: next-intl resolves `a.b.0` by plain property
// access, so an array is a valid message container and its indices do not need
// to be enumerated here.
function flatten(value, prefix = "", out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, full, out)
    else out.set(full, child)
  }
  return out
}

const messages = Object.fromEntries(LOCALES.map((locale) => [locale, flatten(loadMessages(locale))]))

test("every locale defines the same set of message keys", () => {
  const union = new Set(LOCALES.flatMap((locale) => [...messages[locale].keys()]))
  for (const locale of LOCALES) {
    const missing = [...union].filter((key) => !messages[locale].has(key)).sort()
    assert.deepEqual(missing, [], `messages/${locale}.json is missing ${missing.length} key(s): ${missing.join(", ")}`)
  }
})

test("no message is an empty string", () => {
  for (const locale of LOCALES) {
    const empty = [...messages[locale]]
      .filter(([, value]) => typeof value === "string" && value.trim() === "")
      .map(([key]) => key)
    assert.deepEqual(empty, [], `messages/${locale}.json has empty values: ${empty.join(", ")}`)
  }
})

test("a leaf key has the same shape (array vs string) in every locale", () => {
  const [reference, ...rest] = LOCALES
  for (const [key, value] of messages[reference]) {
    const expected = Array.isArray(value) ? "array" : typeof value
    for (const locale of rest) {
      const actual = Array.isArray(messages[locale].get(key)) ? "array" : typeof messages[locale].get(key)
      assert.equal(actual, expected, `${key} is ${expected} in ${reference} but ${actual} in ${locale}`)
    }
  }
})

test("ICU placeholders match across locales", () => {
  const placeholders = (value) =>
    typeof value === "string" ? [...value.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort() : []
  const [reference, ...rest] = LOCALES
  for (const [key, value] of messages[reference]) {
    const expected = placeholders(value)
    if (expected.length === 0) continue
    for (const locale of rest) {
      assert.deepEqual(
        placeholders(messages[locale].get(key)),
        expected,
        `${key} uses different placeholders in ${locale} than in ${reference}`,
      )
    }
  }
})
