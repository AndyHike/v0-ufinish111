const crypto = require("node:crypto")

function verifyRemonlineWebhookSignature({ payload, signature, secret, webhookId }) {
  if (!signature || !secret) return false

  const actualBuffer = Buffer.from(String(signature).trim(), "hex")

  const ids = Array.from(new Set([webhookId, payload?.id].filter(Boolean)))

  for (const id of ids) {
    const expected = crypto.createHash("sha256").update(`${id}${secret}`).digest("hex")
    const expectedBuffer = Buffer.from(expected, "hex")

    if (expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      return true
    }
  }

  return false
}

module.exports = {
  verifyRemonlineWebhookSignature,
}
