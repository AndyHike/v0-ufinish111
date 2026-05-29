function createRemonlineRateLimiter({
  maxRequests = 3,
  windowMs = 1000,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let requestCount = 0
  let windowStartedAt = 0

  return {
    async waitForSlot() {
      const current = now()

      if (!windowStartedAt || current - windowStartedAt >= windowMs) {
        windowStartedAt = current
        requestCount = 0
      }

      if (requestCount >= maxRequests) {
        const waitMs = Math.max(windowMs - (current - windowStartedAt), 0)

        if (waitMs > 0) {
          await sleep(waitMs)
        }

        windowStartedAt = now()
        requestCount = 0
      }

      requestCount += 1
    },
  }
}

module.exports = { createRemonlineRateLimiter }
