import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("favicon redirect does not use the internal request origin", async () => {
  const source = await readFile(new URL("../app/favicon.ico/route.ts", import.meta.url), "utf8")

  assert.match(source, /mainSiteUrl/)
  assert.match(source, /siteFaviconPath/)
  assert.doesNotMatch(source, /icon-light-32x32\.png/)
  assert.doesNotMatch(source, /request\.url/)
})

test("favicon and logo fallbacks use DeviceHelp assets instead of legacy v0 icons", async () => {
  const sourcePaths = [
    "../app/[locale]/layout.tsx",
    "../app/api/site-settings/route.ts",
    "../components/dynamic-favicon.tsx",
    "../components/site-logo.tsx",
    "../hooks/use-site-settings.ts",
    "../lib/structured-data.ts",
  ]

  const combined = (
    await Promise.all(sourcePaths.map((path) => readFile(new URL(path, import.meta.url), "utf8")))
  ).join("\n")
  const assetsSource = await readFile(new URL("../lib/site-assets.ts", import.meta.url), "utf8")

  assert.match(assetsSource, /devicehelp-favicon-32\.png/)
  assert.match(assetsSource, /devicehelp-logo\.webp/)
  assert.match(assetsSource, /"\/favicon\.ico"/)
  assert.match(assetsSource, /1750418444610-hgnxmfio3rv\.png/)
  assert.match(combined, /siteFaviconPath/)
  assert.match(combined, /siteLogoPath/)
  assert.match(combined, /normalizeSiteAssetPath/)
  assert.match(combined, /siteAppleIconPath/)
  assert.doesNotMatch(combined, /icon-light-32x32\.png/)
  assert.doesNotMatch(combined, /icon-dark-32x32\.png/)
  assert.doesNotMatch(combined, /apple-icon\.png/)
})
