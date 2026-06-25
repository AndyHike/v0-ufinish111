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

// reservation-cart.ts only has a type-only import, so transpiling the single
// file yields a self-contained CommonJS module we can require directly.
async function importReservationCart() {
  const tempRoot = await mkdtemp(join(tmpdir(), "devicehelp-reservation-cart-"))
  const file = "lib/booking/reservation-cart.ts"
  try {
    const source = await readFile(join(repoRoot, file), "utf8")
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    })
    const outputPath = join(tempRoot, "reservation-cart.js")
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, outputText)
    return require(outputPath)
  } finally {
    setTimeout(() => {
      rm(tempRoot, { recursive: true, force: true }).catch(() => {})
    }, 100)
  }
}

const cart = await importReservationCart()

const sampleLine = {
  serviceId: "svc-display",
  modelId: "iphone-13",
  serviceName: "Výměna displeje",
  serviceSlug: "vymena-displeje",
  brandName: "Apple",
  modelName: "iPhone 13",
  modelSlug: "iphone-13",
  originalPrice: 2500,
}

test("addReservationLine assigns id and default discount choice", () => {
  const next = cart.addReservationLine({ lines: [] }, sampleLine)
  assert.equal(next.lines.length, 1)
  assert.equal(next.lines[0].id, "svc-display:iphone-13")
  assert.deepEqual(next.lines[0].discountChoice, { type: "none" })
})

test("re-adding the same service+model replaces but keeps the discount choice", () => {
  let state = cart.addReservationLine({ lines: [] }, sampleLine)
  state = cart.setReservationLineDiscount(state, "svc-display:iphone-13", { type: "code", code: "DISPLAY10" })
  state = cart.addReservationLine(state, { ...sampleLine, originalPrice: 2600 })

  assert.equal(state.lines.length, 1)
  assert.equal(state.lines[0].originalPrice, 2600)
  assert.deepEqual(state.lines[0].discountChoice, { type: "code", code: "DISPLAY10" })
})

test("same service on a different model is a separate line", () => {
  let state = cart.addReservationLine({ lines: [] }, sampleLine)
  state = cart.addReservationLine(state, { ...sampleLine, modelId: "iphone-14", modelSlug: "iphone-14", modelName: "iPhone 14" })
  assert.equal(state.lines.length, 2)
  assert.equal(cart.getReservationLineCount(state), 2)
})

test("per-line discount choices are independent", () => {
  let state = cart.addReservationLine({ lines: [] }, sampleLine)
  state = cart.addReservationLine(state, { ...sampleLine, serviceId: "svc-battery", serviceName: "Výměna baterie", originalPrice: 900 })

  state = cart.setReservationLineDiscount(state, "svc-display:iphone-13", { type: "code", code: "DISPLAY10" })
  state = cart.setReservationLineDiscount(state, "svc-battery:iphone-13", { type: "code", code: "BATTERY20" })

  const display = state.lines.find((l) => l.serviceId === "svc-display")
  const battery = state.lines.find((l) => l.serviceId === "svc-battery")
  assert.deepEqual(display.discountChoice, { type: "code", code: "DISPLAY10" })
  assert.deepEqual(battery.discountChoice, { type: "code", code: "BATTERY20" })
})

test("removeReservationLine drops the matching line", () => {
  let state = cart.addReservationLine({ lines: [] }, sampleLine)
  state = cart.removeReservationLine(state, "svc-display:iphone-13")
  assert.equal(state.lines.length, 0)
})

test("hasReservationLine reflects membership", () => {
  const state = cart.addReservationLine({ lines: [] }, sampleLine)
  assert.equal(cart.hasReservationLine(state, "svc-display", "iphone-13"), true)
  assert.equal(cart.hasReservationLine(state, "svc-display", "iphone-14"), false)
})
