const crypto = require("node:crypto")

function verifyRemonlineWebhookSignature({ payload, signature, secret }) {
  if (!payload?.id || !signature || !secret) return false

  const expected = crypto.createHash("sha256").update(`${payload.id}${secret}`).digest("hex")
  const expectedBuffer = Buffer.from(expected, "hex")
  const actualBuffer = Buffer.from(String(signature).trim(), "hex")

  if (expectedBuffer.length !== actualBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}

module.exports = {
  verifyRemonlineWebhookSignature,
}
