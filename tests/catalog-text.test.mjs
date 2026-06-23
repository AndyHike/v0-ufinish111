import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const require = createRequire(import.meta.url)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function transpile(source) {
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText
}

// Compile a target module flat in a temp dir, alongside its scope-text dependency,
// rewriting the `@/lib/catalog/scope-text` alias to a sibling relative import.
async function importWithScopeTextDep(file) {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-catalog-text-"))
  try {
    const dep = await readFile(join(repoRoot, "lib/catalog/scope-text.ts"), "utf8")
    await writeFile(join(tempRoot, "scope-text.js"), transpile(dep))

    let source = await readFile(join(repoRoot, file), "utf8")
    source = source.replace(/@\/lib\/catalog\/scope-text/g, "./scope-text")
    await writeFile(join(tempRoot, "target.js"), transpile(source))

    return require(join(tempRoot, "target.js"))
  } finally {
    setTimeout(() => {
      rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }, 100)
  }
}

const { resolveCatalogField } = await importWithScopeTextDep("lib/catalog/catalog-text.ts")

const MODEL_ORDER = [
  { type: "model", id: "m1" },
  { type: "series", id: "s1" },
  { type: "brand", id: "b1" },
]

function row(scope_type, scope_id, locale, description) {
  return { scope_type, scope_id, locale, description }
}

test("most-specific scope wins within the requested language", () => {
  const rows = [row("model", "m1", "uk", "MODEL"), row("series", "s1", "uk", "SERIES"), row("brand", "b1", "uk", "BRAND")]
  assert.equal(resolveCatalogField("description", "uk", rows, MODEL_ORDER), "MODEL")
})

test("falls back model -> series -> brand within the requested language", () => {
  const rows = [row("series", "s1", "uk", "SERIES"), row("brand", "b1", "uk", "BRAND")]
  assert.equal(resolveCatalogField("description", "uk", rows, MODEL_ORDER), "SERIES")

  const rows2 = [row("brand", "b1", "uk", "BRAND")]
  assert.equal(resolveCatalogField("description", "uk", rows2, MODEL_ORDER), "BRAND")
})

test("language is primary: keep requested locale at a less-specific scope before switching language", () => {
  // model has only CS, series has UK -> requested UK takes SERIES (uk), not MODEL (cs)
  const rows = [row("model", "m1", "cs", "MODEL-cs"), row("series", "s1", "uk", "SERIES-uk")]
  assert.equal(resolveCatalogField("description", "uk", rows, MODEL_ORDER), "SERIES-uk")
})

test("switches language only when requested locale exists nowhere; CS preferred next", () => {
  const rows = [row("series", "s1", "cs", "SERIES-cs"), row("model", "m1", "en", "MODEL-en")]
  // No UK anywhere -> next chain entry CS; most-specific CS is series.
  assert.equal(resolveCatalogField("description", "uk", rows, MODEL_ORDER), "SERIES-cs")
})

test("series-page order omits model scope", () => {
  const seriesOrder = [
    { type: "series", id: "s1" },
    { type: "brand", id: "b1" },
  ]
  const rows = [row("model", "m1", "uk", "MODEL"), row("series", "s1", "uk", "SERIES")]
  assert.equal(resolveCatalogField("description", "uk", rows, seriesOrder), "SERIES")
})

test("body field resolves independently of description", () => {
  const rows = [{ scope_type: "model", scope_id: "m1", locale: "cs", description: "D", body: "B" }]
  assert.equal(resolveCatalogField("body", "cs", rows, MODEL_ORDER), "B")
})

test("whitespace-only values are skipped", () => {
  const rows = [row("model", "m1", "uk", "   "), row("series", "s1", "uk", "SERIES")]
  assert.equal(resolveCatalogField("description", "uk", rows, MODEL_ORDER), "SERIES")
})

test("returns null when nothing matches and skips scopes with null ids", () => {
  assert.equal(resolveCatalogField("description", "uk", [], MODEL_ORDER), null)
  const order = [
    { type: "model", id: null },
    { type: "series", id: "s1" },
  ]
  const rows = [row("series", "s1", "uk", "SERIES")]
  assert.equal(resolveCatalogField("description", "uk", rows, order), "SERIES")
})
