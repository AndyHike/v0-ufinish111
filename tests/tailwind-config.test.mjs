import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

test("tailwind config is ESM-safe for Next dev", async () => {
  const source = await readFile(new URL("../tailwind.config.ts", import.meta.url), "utf8")

  assert.doesNotMatch(source, /plugins:\s*\[\s*require\(/)
  assert.match(source, /import\s+\w+\s+from\s+"tailwindcss-animate"/)
})
