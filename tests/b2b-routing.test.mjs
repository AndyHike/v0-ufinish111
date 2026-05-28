import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const source = await readFile(new URL("../lib/b2b-routing.ts", import.meta.url), "utf8")
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
})

const {
  DEFAULT_LOCALE,
  getB2BRedirectTarget,
  getDefaultLocalizedB2BPath,
  isAllowedB2BPath,
  isB2BHost,
  stripHostPort,
} = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(outputText)}`)

test("uses Czech as the default B2B locale", () => {
  assert.equal(DEFAULT_LOCALE, "cs")
})

test("strips ports and lowercases hosts", () => {
  assert.equal(stripHostPort("B2B.DeviceHelp.cz:3000"), "b2b.devicehelp.cz")
  assert.equal(stripHostPort("devicehelp.cz"), "devicehelp.cz")
})

test("detects B2B hosts", () => {
  assert.equal(isB2BHost("b2b.devicehelp.cz"), true)
  assert.equal(isB2BHost("b2b.devicehelp.cz:3000"), true)
  assert.equal(isB2BHost("b2b.localhost:3000"), true)
  assert.equal(isB2BHost("b2b.preview-domain.test"), true)
  assert.equal(isB2BHost("devicehelp.cz"), false)
  assert.equal(isB2BHost("www.devicehelp.cz"), false)
  assert.equal(isB2BHost("notb2b.devicehelp.cz"), false)
})

test("allows only localized B2B microsite paths", () => {
  assert.equal(isAllowedB2BPath("/"), true)
  assert.equal(isAllowedB2BPath("/cs"), true)
  assert.equal(isAllowedB2BPath("/uk"), true)
  assert.equal(isAllowedB2BPath("/en"), true)
  assert.equal(isAllowedB2BPath("/cs/faq"), true)
  assert.equal(isAllowedB2BPath("/uk/faq/"), true)
  assert.equal(isAllowedB2BPath("/en/brands"), false)
  assert.equal(isAllowedB2BPath("/cs/auth/register"), false)
})

test("builds default localized B2B path", () => {
  assert.equal(getDefaultLocalizedB2BPath("/"), "/cs")
  assert.equal(getDefaultLocalizedB2BPath("/brands/apple"), "/cs/brands/apple")
  assert.equal(getDefaultLocalizedB2BPath("/cs/brands/apple"), "/cs/brands/apple")
})

test("redirects B2B disallowed localized paths to the main domain", () => {
  const target = getB2BRedirectTarget({
    host: "b2b.devicehelp.cz",
    pathname: "/cs/brands/apple",
    search: "?from=ad",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple?from=ad")
})

test("redirects B2B disallowed unlocalized paths to the main Czech path", () => {
  const target = getB2BRedirectTarget({
    host: "b2b.devicehelp.cz",
    pathname: "/brands/apple",
    search: "",
    mainBaseUrl: "https://devicehelp.cz",
  })

  assert.equal(target?.toString(), "https://devicehelp.cz/cs/brands/apple")
})

test("does not redirect allowed B2B paths or main-domain paths", () => {
  assert.equal(
    getB2BRedirectTarget({
      host: "b2b.devicehelp.cz",
      pathname: "/cs/faq",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
  assert.equal(
    getB2BRedirectTarget({
      host: "devicehelp.cz",
      pathname: "/cs/brands/apple",
      search: "",
      mainBaseUrl: "https://devicehelp.cz",
    }),
    null,
  )
})
