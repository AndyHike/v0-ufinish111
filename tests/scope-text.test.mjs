import test from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const require = createRequire(import.meta.url)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

async function importCompiled(file) {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-scope-text-"))
  try {
    const source = await readFile(join(repoRoot, file), "utf8")
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    })
    const outputPath = join(tempRoot, file.replace(/\.ts$/, ".js"))
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, outputText)
    return require(outputPath)
  } finally {
    setTimeout(() => {
      rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }, 100)
  }
}

const { langChain, resolveScopedField } = await importCompiled("lib/catalog/scope-text.ts")

const SVC = "svc-1"
const ids = { modelId: "m1", seriesId: "s1", brandId: "b1" }

function row(scope_type, scope_id, locale, detailed_description) {
  return { service_id: SVC, scope_type, scope_id, locale, detailed_description }
}

test("langChain: requested locale first, then CS -> EN -> UK, deduped", () => {
  assert.deepEqual(langChain("uk"), ["uk", "cs", "en"])
  assert.deepEqual(langChain("en"), ["en", "cs", "uk"])
  assert.deepEqual(langChain("cs"), ["cs", "en", "uk"])
})

test("most-specific scope wins within the requested language", () => {
  const rows = [
    row("model", "m1", "uk", "MODEL-uk"),
    row("series", "s1", "uk", "SERIES-uk"),
  ]
  const base = [{ locale: "uk", detailed_description: "BASE-uk" }]
  const v = resolveScopedField("detailed_description", SVC, "uk", rows, base, ids)
  assert.equal(v, "MODEL-uk")
})

test("language is primary: keep requested locale at a less-specific scope before switching language", () => {
  // model has only CS; series has UK. Requested UK must take SERIES-uk, not MODEL-cs.
  const rows = [
    row("model", "m1", "cs", "MODEL-cs"),
    row("series", "s1", "uk", "SERIES-uk"),
  ]
  const base = [{ locale: "cs", detailed_description: "BASE-cs" }]
  const v = resolveScopedField("detailed_description", SVC, "uk", rows, base, ids)
  assert.equal(v, "SERIES-uk")
})

test("falls back to base service text in the requested language", () => {
  const base = [
    { locale: "uk", detailed_description: "BASE-uk" },
    { locale: "cs", detailed_description: "BASE-cs" },
  ]
  const v = resolveScopedField("detailed_description", SVC, "uk", [], base, ids)
  assert.equal(v, "BASE-uk")
})

test("switches language only when requested locale exists nowhere; CS preferred next", () => {
  // No UK anywhere. Should fall to CS (next in chain), most-specific CS available.
  const rows = [row("series", "s1", "cs", "SERIES-cs")]
  const base = [
    { locale: "cs", detailed_description: "BASE-cs" },
    { locale: "en", detailed_description: "BASE-en" },
  ]
  const v = resolveScopedField("detailed_description", SVC, "uk", rows, base, ids)
  assert.equal(v, "SERIES-cs")
})

test("empty/whitespace overrides are skipped", () => {
  const rows = [row("model", "m1", "uk", "   ")]
  const base = [{ locale: "uk", detailed_description: "BASE-uk" }]
  const v = resolveScopedField("detailed_description", SVC, "uk", rows, base, ids)
  assert.equal(v, "BASE-uk")
})

test("returns null when nothing matches in any language", () => {
  const v = resolveScopedField("detailed_description", SVC, "uk", [], [], ids)
  assert.equal(v, null)
})

test("ignores rows from a different service", () => {
  const rows = [{ service_id: "other", scope_type: "model", scope_id: "m1", locale: "uk", detailed_description: "OTHER" }]
  const base = [{ locale: "uk", detailed_description: "BASE-uk" }]
  const v = resolveScopedField("detailed_description", SVC, "uk", rows, base, ids)
  assert.equal(v, "BASE-uk")
})
