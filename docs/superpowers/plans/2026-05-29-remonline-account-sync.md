# RemOnline Account Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first RemOnline phase: reliable two-way account/contact sync, admin visibility and retry, and signed webhook handling.

**Architecture:** Keep order/status code mostly untouched. Add small testable CommonJS helpers for RO App contact payload mapping, rate limiting, and webhook signature verification, then wire them into the existing registration/admin/webhook flows.

**Tech Stack:** Next.js 15 App Router, Supabase service-role client, Node `node:test`, RO App Public API v2, existing shadcn-style admin UI.

---

## File Structure

- Create `scripts/add-remonline-account-sync-fields.sql`: SQL migration for sync tracking fields on `users`.
- Create `lib/services/remonline-contact-payload.js`: pure CommonJS mapping from local user/profile rows into RO App Person or Organization payloads.
- Create `lib/api/remonline-rate-limit.js`: small injectable CommonJS 3 requests/second limiter.
- Modify `lib/api/remonline.ts`: keep legacy order/service methods, add RO App v2 contact methods and 429 retry.
- Modify `lib/services/remonline-sync.ts`: replace legacy `/clients` sync with single-user contact sync and sync state updates.
- Create `lib/api/remonline-webhook-security.js`: pure CommonJS `X-Signature` verification helper.
- Modify `app/actions/auth-api.ts`: set pending sync state and sync by user id after local registration.
- Modify `app/api/admin/users/route.ts`: expose sync state and trigger sync after admin-created users.
- Modify `app/api/admin/users/[id]/route.ts`: expose sync state and trigger update sync after relevant edits.
- Create `app/api/admin/users/[id]/remonline-sync/route.ts`: admin-only manual retry for one user.
- Modify `components/admin/users-management.tsx`: show sync badge and retry action.
- Modify `app/api/webhooks/remonline/route.ts`: verify signature before dispatching client/order events.
- Modify `app/api/webhooks/remonline/delete-account/route.ts`: verify signature before deleting users.
- Add tests:
  - `tests/remonline-account-schema.test.mjs`
  - `tests/remonline-contact-payload.test.mjs`
  - `tests/remonline-rate-limit.test.mjs`
  - `tests/remonline-sync-source.test.mjs`
  - `tests/remonline-admin-ui.test.mjs`
  - `tests/remonline-webhook-security.test.mjs`

## Task 1: Schema Migration

**Files:**
- Create: `scripts/add-remonline-account-sync-fields.sql`
- Test: `tests/remonline-account-schema.test.mjs`

- [ ] **Step 1: Write the failing schema test**

```js
import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

const source = () => readFile(new URL("../scripts/add-remonline-account-sync-fields.sql", import.meta.url), "utf8")

test("RemOnline account sync migration adds contact type and sync tracking fields", async () => {
  const sql = await source()

  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_contact_type/i)
  assert.match(sql, /remonline_contact_type[\s\S]*CHECK[\s\S]*'person'[\s\S]*'organization'/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_status/i)
  assert.match(sql, /remonline_sync_status[\s\S]*CHECK[\s\S]*'pending'[\s\S]*'synced'[\s\S]*'error'/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_error/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_synced_at/i)
  assert.match(sql, /ALTER TABLE users\s+ADD COLUMN remonline_sync_attempts/i)
  assert.match(sql, /idx_users_remonline_sync_status/i)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-account-schema.test.mjs`

Expected: FAIL because `scripts/add-remonline-account-sync-fields.sql` does not exist yet.

- [ ] **Step 3: Add the migration**

```sql
-- Adds RO App account/contact synchronization state to local users.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remonline_contact_type'
  ) THEN
    ALTER TABLE users
      ADD COLUMN remonline_contact_type TEXT
      CHECK (remonline_contact_type IN ('person', 'organization'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remonline_sync_status'
  ) THEN
    ALTER TABLE users
      ADD COLUMN remonline_sync_status TEXT
      CHECK (remonline_sync_status IN ('pending', 'synced', 'error'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remonline_sync_error'
  ) THEN
    ALTER TABLE users ADD COLUMN remonline_sync_error TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remonline_synced_at'
  ) THEN
    ALTER TABLE users ADD COLUMN remonline_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'remonline_sync_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN remonline_sync_attempts INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_remonline_sync_status ON users(remonline_sync_status);
CREATE INDEX IF NOT EXISTS idx_users_remonline_contact_type ON users(remonline_contact_type);
```

- [ ] **Step 4: Run the schema test**

Run: `node --test tests/remonline-account-schema.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/add-remonline-account-sync-fields.sql tests/remonline-account-schema.test.mjs
git commit -m "feat: add RemOnline account sync fields"
```

## Task 2: Contact Payload Mapping

**Files:**
- Create: `lib/services/remonline-contact-payload.js`
- Test: `tests/remonline-contact-payload.test.mjs`

- [ ] **Step 1: Write the failing payload tests**

```js
import assert from "node:assert/strict"
import test from "node:test"
import contactPayload from "../lib/services/remonline-contact-payload.js"

const { buildRemonlineContactPayload } = contactPayload

test("maps end customer to RO App person with email phone and address", () => {
  const result = buildRemonlineContactPayload({
    email: "ivan@example.com",
    first_name: "Ivan",
    last_name: "Petrenko",
    is_b2b: false,
    phone: "+420775848259",
    address: "Belohorska 209/133, Praha, CZ",
  })

  assert.equal(result.contactType, "person")
  assert.equal(result.endpoint, "/contacts/people")
  assert.deepEqual(result.body, {
    first_name: "Ivan",
    last_name: "Petrenko",
    email: "ivan@example.com",
    address: "Belohorska 209/133, Praha, CZ",
    phones: [
      {
        title: "Primary",
        phone: "+420775848259",
        notify: true,
        has_viber: false,
        has_whatsapp: false,
      },
    ],
  })
})

test("maps B2B account to RO App organization with email phone address ICO and DIC", () => {
  const result = buildRemonlineContactPayload({
    email: "office@example.cz",
    first_name: "Anna",
    last_name: "Novakova",
    is_b2b: true,
    company_name: "Device Help s.r.o.",
    ico: "12345678",
    dic: "CZ12345678",
    phone: "+420777111222",
    billing_street: "Vodickova 12",
    billing_city: "Praha",
    billing_postal_code: "11000",
    billing_country: "CZ",
  })

  assert.equal(result.contactType, "organization")
  assert.equal(result.endpoint, "/contacts/organizations")
  assert.deepEqual(result.body, {
    name: "Device Help s.r.o.",
    email: "office@example.cz",
    address: "Vodickova 12, 11000 Praha, CZ",
    phones: [
      {
        title: "Primary",
        phone: "+420777111222",
        notify: true,
        has_viber: false,
        has_whatsapp: false,
      },
    ],
    business_registration_number: "12345678",
    tax_identification_number: "CZ12345678",
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-contact-payload.test.mjs`

Expected: FAIL because `buildRemonlineContactPayload` is not exported yet.

- [ ] **Step 3: Add minimal payload mapper**

```js
function compact(value) {
  return typeof value === "string" ? value.trim() : ""
}

function buildAddress(input) {
  const structured = [
    compact(input.billing_street),
    [compact(input.billing_postal_code), compact(input.billing_city)].filter(Boolean).join(" "),
    compact(input.billing_country) || "CZ",
  ].filter(Boolean)

  if (structured.length > 1) return structured.join(", ")
  return compact(input.address)
}

function buildPhones(phone) {
  const normalized = compact(phone)
  if (!normalized) return undefined

  return [
    {
      title: "Primary",
      phone: normalized,
      notify: true,
      has_viber: false,
      has_whatsapp: false,
    },
  ]
}

function stripEmpty(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ""
    }),
  )
}

function buildRemonlineContactPayload(input) {
  const email = compact(input.email).toLowerCase()
  const address = buildAddress(input)
  const phones = buildPhones(input.phone)

  if (input.is_b2b) {
    const name =
      compact(input.company_name) ||
      [compact(input.first_name), compact(input.last_name)].filter(Boolean).join(" ") ||
      email

    return {
      contactType: "organization",
      endpoint: "/contacts/organizations",
      body: stripEmpty({
        name,
        email,
        address,
        phones,
        business_registration_number: compact(input.ico),
        tax_identification_number: compact(input.dic),
      }),
    }
  }

  return {
    contactType: "person",
    endpoint: "/contacts/people",
    body: stripEmpty({
      first_name: compact(input.first_name) || email,
      last_name: compact(input.last_name),
      email,
      address,
      phones,
    }),
  }
}

module.exports = {
  buildAddress,
  buildPhones,
  buildRemonlineContactPayload,
}
```

- [ ] **Step 4: Run the payload tests**

Run: `node --test tests/remonline-contact-payload.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/services/remonline-contact-payload.js tests/remonline-contact-payload.test.mjs
git commit -m "feat: map local users to RO App contacts"
```

## Task 3: Rate Limiter and RO App Contact Client

**Files:**
- Create: `lib/api/remonline-rate-limit.js`
- Modify: `lib/api/remonline.ts`
- Test: `tests/remonline-rate-limit.test.mjs`

- [ ] **Step 1: Write the failing rate limiter tests**

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-rate-limit.test.mjs`

Expected: FAIL because `createRemonlineRateLimiter` is not exported yet.

- [ ] **Step 3: Add the limiter**

```js
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
        if (waitMs > 0) await sleep(waitMs)
        windowStartedAt = now()
        requestCount = 0
      }

      requestCount += 1
    },
  }
}

module.exports = {
  createRemonlineRateLimiter,
}
```

- [ ] **Step 4: Run the rate limiter tests**

Run: `node --test tests/remonline-rate-limit.test.mjs`

Expected: PASS.

- [ ] **Step 5: Add RO App v2 contact methods to `lib/api/remonline.ts`**

Keep existing order/service methods intact. Add a second base URL and methods shaped like this:

```ts
import rateLimitModule from "@/lib/api/remonline-rate-limit"

const { createRemonlineRateLimiter } = rateLimitModule

type RemonlineContactType = "person" | "organization"

type RemonlineContactResult = {
  success: boolean
  contactType?: RemonlineContactType
  id?: number
  data?: any
  message?: string
  details?: any
}

class RemonlineClient {
  private apiKey: string
  private baseUrl: string
  private roAppBaseUrl = "https://api.roapp.io/v2"
  private limiter = createRemonlineRateLimiter()

  constructor() {
    this.apiKey = process.env.REMONLINE_API_KEY || process.env.REMONLINE_API_TOKEN || ""
    this.baseUrl = "https://api.remonline.app"
  }

  private async makeRoAppRequest(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    await this.limiter.waitForSlot()

    const response = await fetch(`${this.roAppBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    })

    const text = await response.text()
    const data = text ? JSON.parse(text) : {}

    if (response.status === 429 && retryCount < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
      return this.makeRoAppRequest(endpoint, options, retryCount + 1)
    }

    if (!response.ok) {
      return { success: false, message: `RO App request failed with status ${response.status}`, details: data }
    }

    return { success: true, data }
  }

  async createPerson(body: Record<string, any>): Promise<RemonlineContactResult> {
    const result = await this.makeRoAppRequest("/contacts/people", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    return this.normalizeContactResult(result, "person")
  }

  async createOrganization(body: Record<string, any>): Promise<RemonlineContactResult> {
    const result = await this.makeRoAppRequest("/contacts/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    return this.normalizeContactResult(result, "organization")
  }

  async updatePerson(id: number, body: Record<string, any>): Promise<RemonlineContactResult> {
    const result = await this.makeRoAppRequest(`/contacts/people/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    return this.normalizeContactResult(result, "person", id)
  }

  async updateOrganization(id: number, body: Record<string, any>): Promise<RemonlineContactResult> {
    const result = await this.makeRoAppRequest(`/contacts/organizations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
    return this.normalizeContactResult(result, "organization", id)
  }

  private normalizeContactResult(result: any, contactType: RemonlineContactType, fallbackId?: number) {
    if (!result.success) return { success: false, contactType, message: result.message, details: result.details }
    const id = result.data?.id || result.data?.data?.id || fallbackId
    return { success: true, contactType, id, data: result.data }
  }
}
```

- [ ] **Step 6: Run verification for this task**

Run:

```bash
node --test tests/remonline-rate-limit.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/api/remonline-rate-limit.js lib/api/remonline.ts tests/remonline-rate-limit.test.mjs
git commit -m "feat: add RO App contact client"
```

## Task 4: Single-User Sync Service and Sync State

**Files:**
- Modify: `lib/services/remonline-sync.ts`
- Test: `tests/remonline-sync-source.test.mjs`

- [ ] **Step 1: Write the failing source contract test**

```js
import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

const source = () => readFile(new URL("../lib/services/remonline-sync.ts", import.meta.url), "utf8")

test("RemOnline sync service syncs one local user and writes sync state", async () => {
  const text = await source()

  assert.match(text, /export async function syncUserToRemonline/)
  assert.match(text, /buildRemonlineContactPayload/)
  assert.match(text, /remonline_sync_status:\s*"pending"/)
  assert.match(text, /remonline_sync_status:\s*"synced"/)
  assert.match(text, /remonline_sync_status:\s*"error"/)
  assert.match(text, /remonline_contact_type/)
  assert.match(text, /remonline_sync_error/)
  assert.match(text, /remonline_sync_attempts/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-sync-source.test.mjs`

Expected: FAIL because the service still uses legacy `syncClientToRemonline` only.

- [ ] **Step 3: Implement `syncUserToRemonline`**

Use this shape in `lib/services/remonline-sync.ts`:

```ts
import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import contactPayload from "@/lib/services/remonline-contact-payload"

const { buildRemonlineContactPayload } = contactPayload

type SyncOptions = {
  supabase?: ReturnType<typeof createClient>
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500)
  return String(error || "Unknown RemOnline sync error").slice(0, 500)
}

async function markSyncPending(supabase: any, userId: string) {
  await supabase
    .from("users")
    .update({
      remonline_sync_status: "pending",
      remonline_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
}

export async function syncUserToRemonline(userId: string, options: SyncOptions = {}) {
  const supabase = options.supabase || createClient()
  await markSyncPending(supabase, userId)

  const { data: user, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      first_name,
      last_name,
      is_b2b,
      ico,
      dic,
      company_name,
      remonline_id,
      remonline_contact_type,
      remonline_sync_attempts,
      profiles!left(phone, address, billing_street, billing_city, billing_postal_code, billing_country)
    `)
    .eq("id", userId)
    .single()

  if (error || !user) {
    throw new Error(error?.message || "User not found")
  }

  const profile = Array.isArray((user as any).profiles) ? (user as any).profiles[0] : (user as any).profiles
  const payload = buildRemonlineContactPayload({ ...(user as any), ...(profile || {}) })
  const existingId = (user as any).remonline_id ? Number((user as any).remonline_id) : null

  const result = existingId
    ? payload.contactType === "organization"
      ? await remonline.updateOrganization(existingId, payload.body)
      : await remonline.updatePerson(existingId, payload.body)
    : payload.contactType === "organization"
      ? await remonline.createOrganization(payload.body)
      : await remonline.createPerson(payload.body)

  if (!result.success || !result.id) {
    const message = result.message || "RO App did not return a contact id"
    await supabase
      .from("users")
      .update({
        remonline_sync_status: "error",
        remonline_sync_error: message.slice(0, 500),
        remonline_sync_attempts: ((user as any).remonline_sync_attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
    return { success: false, message }
  }

  await supabase
    .from("users")
    .update({
      remonline_id: result.id,
      remonline_contact_type: payload.contactType,
      remonline_sync_status: "synced",
      remonline_sync_error: null,
      remonline_synced_at: new Date().toISOString(),
      remonline_sync_attempts: ((user as any).remonline_sync_attempts || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  return { success: true, remonlineId: result.id, contactType: payload.contactType }
}

export async function syncClientToRemonline() {
  return {
    success: false,
    message: "syncClientToRemonline is deprecated. Use syncUserToRemonline(userId).",
  }
}
```

- [ ] **Step 4: Run verification for this task**

Run:

```bash
node --test tests/remonline-sync-source.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/services/remonline-sync.ts tests/remonline-sync-source.test.mjs
git commit -m "feat: sync local users to RO App contacts"
```

## Task 5: Registration and Admin User API Integration

**Files:**
- Modify: `app/actions/auth-api.ts`
- Modify: `app/api/admin/users/route.ts`
- Modify: `app/api/admin/users/[id]/route.ts`
- Test: extend `tests/business-registration.test.mjs`

- [ ] **Step 1: Add failing tests for integration points**

Append these assertions to `tests/business-registration.test.mjs`:

```js
test("registration marks RemOnline sync pending and syncs by user id", async () => {
  const source = await read("../app/actions/auth-api.ts")

  assert.match(source, /remonline_sync_status:\s*"pending"/)
  assert.match(source, /syncUserToRemonline\(newUser\.id\)/)
  assert.doesNotMatch(source, /syncClientToRemonline\(remonlineUserData\)/)
})

test("admin users API exposes RemOnline sync fields", async () => {
  const source = await read("../app/api/admin/users/route.ts")

  assert.match(source, /remonline_id/)
  assert.match(source, /remonline_contact_type/)
  assert.match(source, /remonline_sync_status/)
  assert.match(source, /remonline_sync_error/)
  assert.match(source, /remonline_synced_at/)
  assert.match(source, /remonline_sync_attempts/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/business-registration.test.mjs`

Expected: FAIL because registration/admin user routes do not use the new sync fields yet.

- [ ] **Step 3: Update registration action**

In `app/actions/auth-api.ts`:

```ts
import { syncUserToRemonline } from "@/lib/services/remonline-sync"
```

When inserting a new user, include:

```ts
remonline_sync_status: "pending",
remonline_sync_attempts: 0,
```

After profile creation, replace the legacy background call with:

```ts
syncUserToRemonline(newUser.id).catch((error) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Error syncing user with RemOnline:", error)
  }
})
```

For an existing user path, call:

```ts
syncUserToRemonline(existingUser.id).catch((error) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Error syncing existing user with RemOnline:", error)
  }
})
```

- [ ] **Step 4: Update admin user GET/POST/PATCH routes**

In both admin user route selects, include:

```ts
remonline_id,
remonline_contact_type,
remonline_sync_status,
remonline_sync_error,
remonline_synced_at,
remonline_sync_attempts,
```

In transformed users, include the same keys.

In admin `POST`, insert:

```ts
remonline_sync_status: "pending",
remonline_sync_attempts: 0,
```

After profile creation, call:

```ts
syncUserToRemonline(authUser.user.id).catch((error) => {
  console.error("Failed to sync admin-created user to RemOnline:", error)
})
```

In admin `PATCH`, after successful user/profile update, call:

```ts
syncUserToRemonline(id).catch((error) => {
  console.error("Failed to sync updated user to RemOnline:", error)
})
```

- [ ] **Step 5: Run verification for this task**

Run:

```bash
node --test tests/business-registration.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/actions/auth-api.ts app/api/admin/users/route.ts app/api/admin/users/[id]/route.ts tests/business-registration.test.mjs
git commit -m "feat: mark and trigger RemOnline account sync"
```

## Task 6: Manual Single-Account Retry Endpoint

**Files:**
- Create: `app/api/admin/users/[id]/remonline-sync/route.ts`
- Test: extend `tests/remonline-sync-source.test.mjs`

- [ ] **Step 1: Add failing source test**

```js
test("admin manual RemOnline sync endpoint checks admin session and syncs requested user", async () => {
  const route = await readFile(
    new URL("../app/api/admin/users/[id]/remonline-sync/route.ts", import.meta.url),
    "utf8",
  )

  assert.match(route, /getSession/)
  assert.match(route, /session\.user\.role !== "admin"/)
  assert.match(route, /syncUserToRemonline\(id\)/)
  assert.match(route, /export async function POST/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-sync-source.test.mjs`

Expected: FAIL because the route file does not exist yet.

- [ ] **Step 3: Add the endpoint**

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncUserToRemonline } from "@/lib/services/remonline-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = (await params).id
  const result = await syncUserToRemonline(id)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 4: Run verification for this task**

Run:

```bash
node --test tests/remonline-sync-source.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/users/[id]/remonline-sync/route.ts tests/remonline-sync-source.test.mjs
git commit -m "feat: add RemOnline account retry endpoint"
```

## Task 7: Admin Sync Status UI

**Files:**
- Modify: `components/admin/users-management.tsx`
- Test: `tests/remonline-admin-ui.test.mjs`

- [ ] **Step 1: Write the failing admin UI source test**

```js
import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

const source = () => readFile(new URL("../components/admin/users-management.tsx", import.meta.url), "utf8")

test("admin users table shows RemOnline sync state and retry action", async () => {
  const text = await source()

  assert.match(text, /remonline_sync_status/)
  assert.match(text, /remonline_contact_type/)
  assert.match(text, /remonline_sync_error/)
  assert.match(text, /handleSyncRemonline/)
  assert.match(text, /\/api\/admin\/users\/\$\{userId\}\/remonline-sync/)
  assert.match(text, /Sync RemOnline/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-admin-ui.test.mjs`

Expected: FAIL because the UI does not expose sync fields yet.

- [ ] **Step 3: Extend the `User` interface**

```ts
remonline_id: number | null
remonline_contact_type: "person" | "organization" | null
remonline_sync_status: "pending" | "synced" | "error" | null
remonline_sync_error: string | null
remonline_synced_at: string | null
remonline_sync_attempts: number | null
```

- [ ] **Step 4: Add UI helpers**

```tsx
const getRemonlineBadge = (user: User) => {
  if (user.remonline_sync_status === "synced") {
    return (
      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
        RO {user.remonline_contact_type || "contact"} #{user.remonline_id}
      </Badge>
    )
  }

  if (user.remonline_sync_status === "error") {
    return (
      <Badge variant="destructive" title={user.remonline_sync_error || "RemOnline sync failed"}>
        RO error
      </Badge>
    )
  }

  if (user.remonline_sync_status === "pending") {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
        RO pending
      </Badge>
    )
  }

  return <Badge variant="outline">RO not synced</Badge>
}

const handleSyncRemonline = async (userId: string) => {
  setIsSubmitting(true)
  try {
    const response = await fetch(`/api/admin/users/${userId}/remonline-sync`, { method: "POST" })
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || "RemOnline sync failed")
    }
    toast({ title: "Success", description: "RemOnline sync completed" })
    fetchUsers()
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "RemOnline sync failed",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}
```

- [ ] **Step 5: Render badge and menu action**

Under the user's email/company block, render:

```tsx
<div className="mt-1">{getRemonlineBadge(user)}</div>
```

In the action menu, render:

```tsx
{(user.remonline_sync_status === "error" || !user.remonline_id) && (
  <DropdownMenuItem onClick={() => handleSyncRemonline(user.id)} disabled={isSubmitting}>
    Sync RemOnline
  </DropdownMenuItem>
)}
```

- [ ] **Step 6: Run verification for this task**

Run:

```bash
node --test tests/remonline-admin-ui.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add components/admin/users-management.tsx tests/remonline-admin-ui.test.mjs
git commit -m "feat: show RemOnline account sync in admin"
```

## Task 8: Signed Webhook Verification

**Files:**
- Create: `lib/api/remonline-webhook-security.js`
- Modify: `app/api/webhooks/remonline/route.ts`
- Modify: `app/api/webhooks/remonline/delete-account/route.ts`
- Test: `tests/remonline-webhook-security.test.mjs`

- [ ] **Step 1: Write the failing webhook security tests**

```js
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

test("rejects invalid RO App webhook signature", () => {
  const payload = { id: "9cba80cc-93b5-459b-bfd3-445e724dafc5", event_name: "Client.Created" }

  assert.equal(verifyRemonlineWebhookSignature({ payload, signature: "bad", secret: "secret" }), false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/remonline-webhook-security.test.mjs`

Expected: FAIL because the verification helper does not exist yet.

- [ ] **Step 3: Add the verification helper**

```js
const crypto = require("node:crypto")

function verifyRemonlineWebhookSignature({ payload, signature, secret }) {
  if (!payload?.id || !signature || !secret) return false

  const expected = crypto.createHash("sha256").update(`${payload.id}${secret}`).digest("hex")
  const expectedBuffer = Buffer.from(expected, "hex")
  const actualBuffer = Buffer.from(signature, "hex")

  if (expectedBuffer.length !== actualBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer)
}

module.exports = {
  verifyRemonlineWebhookSignature,
}
```

- [ ] **Step 4: Integrate signature checks into routes**

In `app/api/webhooks/remonline/route.ts`, read raw text, parse JSON, choose secret, verify, then dispatch:

```ts
import webhookSecurity from "@/lib/api/remonline-webhook-security"

const { verifyRemonlineWebhookSignature } = webhookSecurity

const payloadText = await request.text()
const payload = JSON.parse(payloadText)
const eventName = payload.event_name || ""
const signature = request.headers.get("x-signature") || request.headers.get("X-Signature")
const secret = eventName.startsWith("Order.") ? ORDER_WEBHOOK_SECRET : GENERAL_WEBHOOK_SECRET

if (!verifyRemonlineWebhookSignature({ payload, signature, secret })) {
  return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 401 })
}
```

Remove the fallback secrets `"your-order-webhook-secret"` and `"your-webhook-secret"`. Use empty strings when env vars are missing and reject unsigned requests.

In `app/api/webhooks/remonline/delete-account/route.ts`, use `REMONLINE_DELETE_ACCOUNT_WEBHOOK_SECRET` and the same helper before `handleClientDeletion`.

- [ ] **Step 5: Run verification for this task**

Run:

```bash
node --test tests/remonline-webhook-security.test.mjs
npx tsc --noEmit --pretty false
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/api/remonline-webhook-security.js app/api/webhooks/remonline/route.ts app/api/webhooks/remonline/delete-account/route.ts tests/remonline-webhook-security.test.mjs
git commit -m "feat: verify RemOnline webhook signatures"
```

## Task 9: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run account-specific tests**

Run:

```bash
node --test tests/remonline-account-schema.test.mjs
node --test tests/remonline-contact-payload.test.mjs
node --test tests/remonline-rate-limit.test.mjs
node --test tests/remonline-sync-source.test.mjs
node --test tests/remonline-admin-ui.test.mjs
node --test tests/remonline-webhook-security.test.mjs
```

Expected: every command exits 0.

- [ ] **Step 2: Run existing related tests**

Run:

```bash
node --test tests/business-registration.test.mjs
npm run test:b2b-routing
npm run test:b2b-content
npm run test:b2b-seo
```

Expected: every command exits 0.

- [ ] **Step 3: Run TypeScript verification**

Run: `npx tsc --noEmit --pretty false`

Expected: exit 0.

- [ ] **Step 4: Inspect git diff**

Run: `git status --short && git diff --stat`

Expected: only RemOnline account-sync files are changed since the task commits.

- [ ] **Step 5: Report live-test boundary**

State explicitly that live RO App contact creation was not executed unless the user approves creating/updating real CRM contacts.
