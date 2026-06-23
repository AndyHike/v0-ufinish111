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

async function importWithScopeTextDep(file) {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-scope-faqs-"))
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

const { resolveScopedFaqs } = await importWithScopeTextDep("lib/catalog/scope-faqs.ts")

// helper to build a FAQ entry
function faq(position, translations) {
  return { position, translations }
}
function tr(locale, question, answer) {
  return { locale, question, answer }
}

test("most specific scope with FAQs wins as a whole list (model > series > base)", () => {
  const model = [faq(0, [tr("cs", "MQ", "MA")])]
  const series = [faq(0, [tr("cs", "SQ", "SA")])]
  const base = [faq(0, [tr("cs", "BQ", "BA")])]
  const out = resolveScopedFaqs("cs", [model, series, base])
  assert.deepEqual(out, [{ question: "MQ", answer: "MA" }])
})

test("series used when model has no FAQs", () => {
  const series = [faq(0, [tr("cs", "SQ", "SA")])]
  const base = [faq(0, [tr("cs", "BQ", "BA")])]
  const out = resolveScopedFaqs("cs", [[], series, base])
  assert.deepEqual(out, [{ question: "SQ", answer: "SA" }])
})

test("base used when model and series both empty", () => {
  const base = [faq(0, [tr("cs", "BQ", "BA")])]
  const out = resolveScopedFaqs("cs", [[], [], base])
  assert.deepEqual(out, [{ question: "BQ", answer: "BA" }])
})

test("entries resolved language-primary then CS -> EN -> UK", () => {
  // requested uk; entry only has cs -> falls to cs
  const model = [faq(0, [tr("cs", "Q-cs", "A-cs")]), faq(1, [tr("uk", "Q-uk", "A-uk")])]
  const out = resolveScopedFaqs("uk", [model, [], []])
  assert.deepEqual(out, [
    { question: "Q-cs", answer: "A-cs" },
    { question: "Q-uk", answer: "A-uk" },
  ])
})

test("entries are ordered by position", () => {
  const model = [faq(2, [tr("cs", "Q2", "A2")]), faq(0, [tr("cs", "Q0", "A0")]), faq(1, [tr("cs", "Q1", "A1")])]
  const out = resolveScopedFaqs("cs", [model, [], []])
  assert.deepEqual(
    out.map((f) => f.question),
    ["Q0", "Q1", "Q2"],
  )
})

test("an entry missing question OR answer is dropped; falls through if all dropped", () => {
  // model entry has question but no answer -> not usable -> model list empty -> series wins
  const model = [faq(0, [tr("cs", "Q-only", "")])]
  const series = [faq(0, [tr("cs", "SQ", "SA")])]
  const out = resolveScopedFaqs("cs", [model, series, []])
  assert.deepEqual(out, [{ question: "SQ", answer: "SA" }])
})

test("returns empty list when no scope has usable FAQs", () => {
  assert.deepEqual(resolveScopedFaqs("cs", [[], [], []]), [])
  assert.deepEqual(resolveScopedFaqs("cs", [[faq(0, [tr("cs", "  ", "  ")])], [], []]), [])
})
