import { readFile, stat } from "node:fs/promises"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import test from "node:test"
import webhookSecurity from "../lib/api/remonline-webhook-security.js"

const { verifyRemonlineWebhookSignature } = webhookSecurity

test("validates RO App webhook signature from webhook id and secret", () => {
  const payload = { id: "9cba80cc-93b5-459b-bfd3-445e724dafc5", event_name: "Client.Created" }
  const secret = "secret"
  const signature = crypto.createHash("sha256").update(`${payload.id}${secret}`).digest("hex")

  assert.equal(verifyRemonlineWebhookSignature({ payload, signature, secret }), true)
})

test("validates RO App webhook signature from x-webhook-id when provided", () => {
  const payload = { id: "body-event-id", event_name: "Order.Created" }
  const webhookId = "dd0c43bd-6802-4c6e-97d3-355b68ce1db3"
  const secret = "secret"
  const signature = crypto.createHash("sha256").update(`${webhookId}${secret}`).digest("hex")

  assert.equal(verifyRemonlineWebhookSignature({ payload, signature, secret, webhookId }), true)
})

test("rejects invalid or missing RO App webhook signature inputs", () => {
  const payload = { id: "9cba80cc-93b5-459b-bfd3-445e724dafc5", event_name: "Client.Created" }

  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "bad", secret: "secret" }), false)
  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "", secret: "secret" }), false)
  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "bad", secret: "" }), false)
})

async function pathExists(path) {
  try {
    await stat(new URL(path, import.meta.url))
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

test("RemOnline canonical webhook route uses one shared secret before handlers mutate data", async () => {
  const mainRoute = await readFile(new URL("../app/api/webhooks/remonline/route.ts", import.meta.url), "utf8")

  assert.match(mainRoute, /verifyRemonlineWebhookSignature/)
  assert.match(mainRoute, /request\.text\(\)/)
  assert.match(mainRoute, /x-signature/)
  assert.match(mainRoute, /x-webhook-id/)
  assert.match(mainRoute, /payload\?\.\["x-signature"\]/)
  assert.match(mainRoute, /REMONLINE_WEBHOOK_SECRET/)
  assert.doesNotMatch(mainRoute, /REMONLINE_ORDER_WEBHOOK_SECRET/)
  assert.doesNotMatch(mainRoute, /REMONLINE_DELETE_ACCOUNT_WEBHOOK_SECRET/)
  assert.doesNotMatch(mainRoute, /your-webhook-secret/)
  assert.doesNotMatch(mainRoute, /webhook verification will be skipped/i)

  assert.ok(mainRoute.indexOf("verifyRemonlineWebhookSignature({ payload") < mainRoute.indexOf("return await handleOrderEvents"))
  assert.ok(mainRoute.indexOf("verifyRemonlineWebhookSignature({ payload") < mainRoute.indexOf("return await handleClientEvents"))
})

test("RemOnline legacy webhook routes are removed in favor of the canonical endpoint", async () => {
  assert.equal(await pathExists("../app/api/webhooks/remonline/delete-account/route.ts"), false)
  assert.equal(await pathExists("../app/api/webhooks/remonline/order/route.ts"), false)
  assert.equal(await pathExists("../app/app/api/webhooks/remonline/order/route.ts"), false)
  assert.equal(await pathExists("../app/api/webhook/remonline/route.ts"), false)
})
