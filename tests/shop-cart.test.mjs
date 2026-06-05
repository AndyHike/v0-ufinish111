import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/shop/cart.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})
const { addCartLine, createCartLine, removeCartLine, setCartLineQuantity } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`
)

test("creates variant cart line snapshots", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })

  assert.equal(line.variantId, "variant-1")
  assert.equal(line.currency, "CZK")
})

test("adds existing line without exceeding max quantity", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 2,
  })
  const cart = addCartLine({ lines: [line] }, line, 3)

  assert.equal(cart.lines[0].quantity, 3)
})

test("does not add unavailable lines", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 12",
    price: 239,
    quantity: 1,
  })
  const cart = addCartLine({ lines: [] }, line, 0)

  assert.equal(cart.lines.length, 0)
})

test("sets quantity with max guard", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })
  const cart = setCartLineQuantity({ lines: [line] }, "variant-1", 8, 5)

  assert.equal(cart.lines[0].quantity, 5)
})

test("removes a line when quantity is set to zero availability", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })
  const cart = setCartLineQuantity({ lines: [line] }, "variant-1", 2, 0)

  assert.equal(cart.lines.length, 0)
})

test("removes cart lines by variant id", () => {
  const line = createCartLine({
    itemId: "item-1",
    variantId: "variant-1",
    title: "Glass - iPhone 13",
    price: 249,
    quantity: 1,
  })
  const cart = removeCartLine({ lines: [line] }, "variant-1")

  assert.equal(cart.lines.length, 0)
})
