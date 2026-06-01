const crypto = require("node:crypto")

function verifyRemonlineWebhookSignature({ payload, signature, secret, webhookId }) {
  const id = webhookId || payload?.id
  if (!id || !signature || !secret) return false

  const expected = crypto.createHash("sha256").update(`${id}${secret}`).digest("hex")
  const expectedBuffer = Buffer.from(expected, "hex")
  const actualBuffer = Buffer.from(String(signature).trim(), "hex")

  if (expectedBuffer.length !== actualBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}

module.exports = {
  verifyRemonlineWebhookSignature,
}
