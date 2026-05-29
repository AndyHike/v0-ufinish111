import assert from "node:assert/strict"
import test from "node:test"
import rateLimitModule from "../lib/api/remonline-rate-limit.js"

const { createRemonlineRateLimiter } = rateLimitModule

test("allows the first three requests in a one second window", async () => {
  const sleeps = []
  const limiter = createRemonlineRateLimiter({
    now: () => 1000,
    sleep: async (ms) => sleeps.push(ms),
  })

  await limiter.waitForSlot()
  await limiter.waitForSlot()
  await limiter.waitForSlot()

  assert.deepEqual(sleeps, [])
})

test("waits before a fourth request in the same one second window", async () => {
  const sleeps = []
  let currentTime = 1000
  const limiter = createRemonlineRateLimiter({
    now: () => currentTime,
    sleep: async (ms) => {
      sleeps.push(ms)
      currentTime += ms
    },
  })

  await limiter.waitForSlot()
  await limiter.waitForSlot()
  await limiter.waitForSlot()
  await limiter.waitForSlot()

  assert.deepEqual(sleeps, [1000])
})

test("resets after the one second window naturally elapses", async () => {
  const sleeps = []
  let currentTime = 1000
  const limiter = createRemonlineRateLimiter({
    now: () => currentTime,
    sleep: async (ms) => {
      sleeps.push(ms)
      currentTime += ms
    },
  })

  await limiter.waitForSlot()
  await limiter.waitForSlot()
  await limiter.waitForSlot()

  currentTime = 2000

  await limiter.waitForSlot()

  assert.deepEqual(sleeps, [])
})
