import { readFile } from "node:fs/promises"
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

test("rejects invalid or missing RO App webhook signature inputs", () => {
  const payload = { id: "9cba80cc-93b5-459b-bfd3-445e724dafc5", event_name: "Client.Created" }

  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "bad", secret: "secret" }), false)
  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "", secret: "secret" }), false)
  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "bad", secret: "" }), false)
})

test("RemOnline webhook routes verify X-Signature before handlers mutate data", async () => {
  const mainRoute = await readFile(new URL("../app/api/webhooks/remonline/route.ts", import.meta.url), "utf8")
  const deleteRoute = await readFile(
    new URL("../app/api/webhooks/remonline/delete-account/route.ts", import.meta.url),
    "utf8",
  )

  for (const route of [mainRoute, deleteRoute]) {
    assert.match(route, /verifyRemonlineWebhookSignature/)
    assert.match(route, /request\.text\(\)/)
    assert.match(route, /x-signature/)
    assert.doesNotMatch(route, /your-webhook-secret/)
    assert.doesNotMatch(route, /webhook verification will be skipped/i)
  }

  assert.ok(mainRoute.indexOf("verifyRemonlineWebhookSignature({ payload") < mainRoute.indexOf("return await handleOrderEvents"))
  assert.ok(mainRoute.indexOf("verifyRemonlineWebhookSignature({ payload") < mainRoute.indexOf("return await handleClientEvents"))
  assert.ok(deleteRoute.indexOf("verifyRemonlineWebhookSignature({ payload") < deleteRoute.indexOf("await handleClientDeletion"))
})
