# RemOnline Admin Order Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only RemOnline order recovery flow with a sync issue inbox and manual order sync, while keeping user profile order views local-only.

**Architecture:** Signed webhooks remain payload-first and never fetch RemOnline API data. When an order webhook cannot be applied locally, the app stores a `remonline_order_sync_issues` record and still acknowledges the webhook. Admin-only endpoints list/ignore issues and manually sync a single order by fetching RemOnline order details and items through the existing rate-limited API client.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/Postgres SQL, source-level Node tests with `node --test`, existing RemOnline API client/rate limiter, shadcn-style UI components, lucide-react icons.

---

## File Structure

- Create `scripts/create-remonline-order-sync-issues-table.sql`: Postgres table, indexes, RLS policies for the issue inbox.
- Create `tests/remonline-order-sync.test.mjs`: source-level regression tests for schema, webhook issue recording, admin-only sync, admin issue APIs/UI, and user profile boundaries.
- Create `lib/services/remonline-order-sync-issues.ts`: issue inbox service for record/list/resolve/ignore operations.
- Create `lib/services/remonline-order-sync.ts`: manual admin sync service that fetches order details/items and upserts local order tables.
- Modify `app/api/webhooks/remonline/handlers/order-handler.ts`: record an order sync issue before returning webhook-safe `200 ignored` for signed but locally unapplied order events.
- Modify `app/api/webhooks/remonline/services/order-service.ts`: add a full-data manual upsert method that can replace services from RemOnline API data.
- Modify `lib/api/remonline.ts`: keep existing order methods, but normalize `getOrderById` and `getOrderItems` return shapes enough for the manual sync service.
- Create `app/api/admin/remonline/orders/[id]/sync/route.ts`: admin-only manual sync endpoint.
- Create `app/api/admin/remonline/order-sync-issues/route.ts`: admin-only list endpoint.
- Create `app/api/admin/remonline/order-sync-issues/[id]/route.ts`: admin-only ignore endpoint.
- Create `components/admin/remonline-order-sync-issues.tsx`: admin issue inbox table and row actions.
- Create `app/[locale]/admin/remonline-orders/page.tsx`: admin page wrapping the issue inbox.
- Modify `components/admin/admin-sidebar.tsx`: add one admin navigation item for RemOnline order sync.
- Modify `messages/uk.json`, `messages/cs.json`, `messages/en.json`: add admin labels for the new page/actions.

---

### Task 1: Define Order Sync Issue Schema Tests

**Files:**
- Create: `tests/remonline-order-sync.test.mjs`
- Test target: `scripts/create-remonline-order-sync-issues-table.sql`

- [ ] **Step 1: Write the failing schema tests**

Add this initial test file:

```js
import { readFile, stat } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

async function pathExists(path) {
  try {
    await stat(new URL(path, import.meta.url))
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

function assertDoesNotImportRemonlineApi(source) {
  assert.doesNotMatch(source, /from\s+["'][^"']*lib\/api\/remonline["']/)
}

test("order sync issue migration stores webhook recovery state", async () => {
  const sql = await read("../scripts/create-remonline-order-sync-issues-table.sql")

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.remonline_order_sync_issues/)
  assert.match(sql, /remonline_event_id TEXT NOT NULL/)
  assert.match(sql, /event_name TEXT NOT NULL/)
  assert.match(sql, /remonline_order_id INTEGER/)
  assert.match(sql, /remonline_client_id INTEGER/)
  assert.match(sql, /status TEXT NOT NULL DEFAULT 'open'/)
  assert.match(sql, /CHECK \(status IN \('open', 'resolved', 'ignored'\)\)/)
  assert.match(sql, /reason TEXT NOT NULL/)
  assert.match(sql, /raw_payload JSONB NOT NULL DEFAULT '\{\}'::jsonb/)
  assert.match(sql, /attempts INTEGER NOT NULL DEFAULT 1/)
  assert.match(sql, /resolved_by UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /ignored_by UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /idx_remonline_order_sync_issues_status/)
  assert.match(sql, /idx_remonline_order_sync_issues_order_id/)
  assert.match(sql, /FOR ALL TO service_role USING \(true\) WITH CHECK \(true\)/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: FAIL with `ENOENT` for `create-remonline-order-sync-issues-table.sql`.

- [ ] **Step 3: Commit the failing test**

```powershell
git add tests/remonline-order-sync.test.mjs
git commit -m "test: define remonline order sync issue schema"
```

---

### Task 2: Add Order Sync Issue Migration

**Files:**
- Create: `scripts/create-remonline-order-sync-issues-table.sql`
- Test: `tests/remonline-order-sync.test.mjs`

- [ ] **Step 1: Create the SQL migration**

Create `scripts/create-remonline-order-sync-issues-table.sql`:

```sql
-- Store signed RemOnline order webhook events that could not be applied locally.
CREATE TABLE IF NOT EXISTS public.remonline_order_sync_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_event_id TEXT NOT NULL UNIQUE,
    event_name TEXT NOT NULL,
    remonline_order_id INTEGER,
    remonline_client_id INTEGER,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'ignored')),
    reason TEXT NOT NULL,
    details TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    attempts INTEGER NOT NULL DEFAULT 1 CHECK (attempts >= 1),
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ignored_at TIMESTAMP WITH TIME ZONE,
    ignored_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_status
    ON public.remonline_order_sync_issues(status);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_order_id
    ON public.remonline_order_sync_issues(remonline_order_id);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_client_id
    ON public.remonline_order_sync_issues(remonline_client_id);

CREATE INDEX IF NOT EXISTS idx_remonline_order_sync_issues_last_seen
    ON public.remonline_order_sync_issues(last_seen_at DESC);

ALTER TABLE public.remonline_order_sync_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage order sync issues"
    ON public.remonline_order_sync_issues;

CREATE POLICY "Service can manage order sync issues"
    ON public.remonline_order_sync_issues
    FOR ALL TO service_role USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Run the schema test**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: PASS for the migration test.

- [ ] **Step 3: Commit**

```powershell
git add scripts/create-remonline-order-sync-issues-table.sql tests/remonline-order-sync.test.mjs
git commit -m "feat: add remonline order sync issue table"
```

---

### Task 3: Add Issue Service Tests

**Files:**
- Modify: `tests/remonline-order-sync.test.mjs`
- Create later: `lib/services/remonline-order-sync-issues.ts`

- [ ] **Step 1: Add failing source-boundary tests**

Append these tests to `tests/remonline-order-sync.test.mjs`:

```js
test("order sync issue service records, resolves, ignores, and lists issues", async () => {
  const servicePath = "../lib/services/remonline-order-sync-issues.ts"
  assert.equal(await pathExists(servicePath), true)

  const service = await read(servicePath)

  assert.match(service, /export async function recordOrderSyncIssue/)
  assert.match(service, /export async function resolveOrderSyncIssues/)
  assert.match(service, /export async function ignoreOrderSyncIssue/)
  assert.match(service, /export async function listOrderSyncIssues/)
  assert.match(service, /\.from\(["']remonline_order_sync_issues["']\)/)
  assert.match(service, /onConflict:\s*["']remonline_event_id["']/)
  assert.match(service, /attempts:\s*\(existingIssue\?\.attempts \|\| 0\) \+ 1/)
  assertDoesNotImportRemonlineApi(service)
})

test("order webhook handler records ignored order events without fetching RemOnline", async () => {
  const handler = await read("../app/api/webhooks/remonline/handlers/order-handler.ts")

  assert.match(handler, /recordOrderSyncIssue/)
  assert.match(handler, /Order not found in database/)
  assert.match(handler, /ignored:\s*true/)
  assert.match(handler, /status:\s*200/)
  assertDoesNotImportRemonlineApi(handler)
  assert.doesNotMatch(handler, /getOrderById|getOrderItems/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: FAIL because `lib/services/remonline-order-sync-issues.ts` does not exist and the webhook handler does not import `recordOrderSyncIssue`.

- [ ] **Step 3: Commit the failing tests**

```powershell
git add tests/remonline-order-sync.test.mjs
git commit -m "test: define remonline order sync issue service"
```

---

### Task 4: Implement Order Sync Issue Service and Webhook Recording

**Files:**
- Create: `lib/services/remonline-order-sync-issues.ts`
- Modify: `app/api/webhooks/remonline/handlers/order-handler.ts`
- Test: `tests/remonline-order-sync.test.mjs`

- [ ] **Step 1: Create the issue service**

Create `lib/services/remonline-order-sync-issues.ts`:

```ts
import { createClient } from "@/lib/supabase"

type SupabaseClientLike = ReturnType<typeof createClient>

type OrderSyncIssueStatus = "open" | "resolved" | "ignored"

type RecordOrderSyncIssueInput = {
  payload: any
  reason: string
  details?: string
  supabase?: SupabaseClientLike
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getPayloadOrderId(payload: any): number | null {
  return numberOrNull(payload?.context?.object_id ?? payload?.metadata?.order?.id)
}

function getPayloadClientId(payload: any): number | null {
  return numberOrNull(payload?.metadata?.client?.id ?? payload?.metadata?.order?.client?.id)
}

function getPayloadEventId(payload: any): string {
  return String(payload?.id || `${payload?.event_name || "unknown"}:${Date.now()}`)
}

export async function recordOrderSyncIssue(input: RecordOrderSyncIssueInput) {
  const supabase = input.supabase || createClient()
  const remonlineEventId = getPayloadEventId(input.payload)
  const now = new Date().toISOString()

  const { data: existingIssue } = await supabase
    .from("remonline_order_sync_issues")
    .select("id, attempts")
    .eq("remonline_event_id", remonlineEventId)
    .maybeSingle()

  const row = {
    remonline_event_id: remonlineEventId,
    event_name: String(input.payload?.event_name || "unknown"),
    remonline_order_id: getPayloadOrderId(input.payload),
    remonline_client_id: getPayloadClientId(input.payload),
    status: "open" as OrderSyncIssueStatus,
    reason: input.reason,
    details: input.details || null,
    raw_payload: input.payload || {},
    attempts: (existingIssue?.attempts || 0) + 1,
    first_seen_at: existingIssue ? undefined : now,
    last_seen_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .upsert(row, { onConflict: "remonline_event_id" })
    .select("*")
    .single()

  if (error) {
    console.error("Failed to record RemOnline order sync issue:", error)
    return null
  }

  return data
}

export async function resolveOrderSyncIssues(remonlineOrderId: number, resolvedBy?: string, supabase = createClient()) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .update({
      status: "resolved",
      resolved_at: now,
      resolved_by: resolvedBy || null,
      updated_at: now,
    })
    .eq("remonline_order_id", remonlineOrderId)
    .eq("status", "open")
    .select("*")

  if (error) throw new Error(`Failed to resolve order sync issues: ${error.message}`)
  return data || []
}

export async function ignoreOrderSyncIssue(issueId: string, ignoredBy: string, supabase = createClient()) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .update({
      status: "ignored",
      ignored_at: now,
      ignored_by: ignoredBy,
      updated_at: now,
    })
    .eq("id", issueId)
    .select("*")
    .single()

  if (error) throw new Error(`Failed to ignore order sync issue: ${error.message}`)
  return data
}

export async function listOrderSyncIssues(status: OrderSyncIssueStatus = "open", supabase = createClient()) {
  const { data, error } = await supabase
    .from("remonline_order_sync_issues")
    .select("*")
    .eq("status", status)
    .order("last_seen_at", { ascending: false })

  if (error) throw new Error(`Failed to list order sync issues: ${error.message}`)
  return data || []
}
```

- [ ] **Step 2: Wire issue recording into order handler ignored paths**

In `app/api/webhooks/remonline/handlers/order-handler.ts`, import:

```ts
import { recordOrderSyncIssue } from "@/lib/services/remonline-order-sync-issues"
```

Change `orderWebhookErrorResponse` to accept webhook data and record 400/404 issues:

```ts
async function orderWebhookErrorResponse(error: unknown, message: string, webhookData?: any) {
  const status = error instanceof RemonlineWebhookOrderError ? error.statusCode : 500
  const shouldAcknowledge =
    error instanceof RemonlineWebhookOrderError && WEBHOOK_ACKNOWLEDGED_ERROR_STATUSES.has(status)

  if (shouldAcknowledge && webhookData) {
    await recordOrderSyncIssue({
      payload: webhookData,
      reason: error instanceof Error ? error.message : message,
      details: message,
    })
  }

  return NextResponse.json(
    {
      success: false,
      ignored: shouldAcknowledge,
      error: message,
      details: error instanceof Error ? error.message : String(error),
    },
    { status: shouldAcknowledge ? 200 : status },
  )
}
```

Update `handleOrderCreated` and `handleOrderUpdated` catches:

```ts
return await orderWebhookErrorResponse(error, "Failed to create order from webhook payload", webhookData)
```

```ts
return await orderWebhookErrorResponse(error, "Failed to update order from webhook payload", webhookData)
```

In `handleOrderStatusChanged`, before returning ignored for missing status:

```ts
await recordOrderSyncIssue({
  payload: webhookData,
  reason: "No new status ID found",
})
```

Before returning ignored for a missing local order:

```ts
await recordOrderSyncIssue({
  payload: webhookData,
  reason: "Order not found in database",
  details: orderCheckError?.message,
})
```

- [ ] **Step 3: Run tests**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs tests/remonline-invoice-sync.test.mjs
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```powershell
git add lib/services/remonline-order-sync-issues.ts app/api/webhooks/remonline/handlers/order-handler.ts tests/remonline-order-sync.test.mjs
git commit -m "feat: record remonline order sync issues"
```

---

### Task 5: Add Manual Order Sync Tests

**Files:**
- Modify: `tests/remonline-order-sync.test.mjs`
- Modify later: `lib/api/remonline.ts`
- Modify later: `app/api/webhooks/remonline/services/order-service.ts`
- Create later: `lib/services/remonline-order-sync.ts`
- Create later: `app/api/admin/remonline/orders/[id]/sync/route.ts`

- [ ] **Step 1: Add failing tests for admin manual order sync boundaries**

Append:

```js
test("manual order sync is admin-only and is the only order path that fetches full RemOnline data", async () => {
  const syncService = await read("../lib/services/remonline-order-sync.ts")
  const adminRoute = await read("../app/api/admin/remonline/orders/[id]/sync/route.ts")
  const apiClient = await read("../lib/api/remonline.ts")
  const orderService = await read("../app/api/webhooks/remonline/services/order-service.ts")
  const userOrdersRoute = await read("../app/api/user/repair-orders/route.ts")

  assert.match(syncService, /remonline\.getOrderById\(remonlineOrderId\)/)
  assert.match(syncService, /remonline\.getOrderItems\(remonlineOrderId\)/)
  assert.match(syncService, /resolveOrderSyncIssues\(remonlineOrderId/)
  assert.match(syncService, /upsertOrderFromRemonlineApi/)

  assert.match(adminRoute, /getSession/)
  assert.match(adminRoute, /session\.user\.role !== "admin"/)
  assert.match(adminRoute, /syncOrderFromRemonline/)
  assert.match(adminRoute, /Invalid order id/)

  assert.match(apiClient, /async getOrderById/)
  assert.match(apiClient, /async getOrderItems/)
  assert.match(orderService, /async upsertOrderFromRemonlineApi/)

  assertDoesNotImportRemonlineApi(userOrdersRoute)
  assert.doesNotMatch(userOrdersRoute, /getOrderById|getOrderItems|fetch\(/)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: FAIL because `lib/services/remonline-order-sync.ts` and the admin sync route do not exist.

- [ ] **Step 3: Commit failing tests**

```powershell
git add tests/remonline-order-sync.test.mjs
git commit -m "test: define admin remonline order sync"
```

---

### Task 6: Implement Manual Order Sync Service

**Files:**
- Modify: `app/api/webhooks/remonline/services/order-service.ts`
- Create: `lib/services/remonline-order-sync.ts`
- Modify: `lib/api/remonline.ts`
- Test: `tests/remonline-order-sync.test.mjs`

- [ ] **Step 1: Add full-data upsert method to OrderService**

In `app/api/webhooks/remonline/services/order-service.ts`, add a public method before `deleteOrder`:

```ts
  async upsertOrderFromRemonlineApi(userId: string, remonlineOrderId: number, orderData: any, orderItems: any[]): Promise<any> {
    const { data: existingOrder } = await this.supabase
      .from("user_repair_orders")
      .select("id")
      .eq("remonline_order_id", remonlineOrderId)
      .maybeSingle()

    const savedOrder = existingOrder
      ? await this.updateOrder(userId, remonlineOrderId, orderData, orderItems)
      : await this.createOrder(userId, remonlineOrderId, orderData, orderItems)

    const orderDbId = existingOrder?.id || savedOrder?.id

    if (orderDbId) {
      await this.supabase.from("user_repair_order_services").delete().eq("order_id", orderDbId)
      if (orderItems.length > 0) {
        await this.storeOrderServices(orderDbId, remonlineOrderId, orderItems)
      }
    }

    return savedOrder
  }
```

If duplicate service deletion becomes visible during tests, refactor `createOrder`/`updateOrder` to avoid double delete/insert by moving service replacement into this method only. Keep the public method name unchanged.

- [ ] **Step 2: Normalize RemOnline order API responses**

In `lib/api/remonline.ts`, keep `getOrderById` and `getOrderItems` but make sure they return usable objects:

```ts
const order = result.data?.data || result.data?.order || result.data
```

For items:

```ts
const items = Array.isArray(result.data)
  ? result.data
  : result.data?.data || result.data?.items || []
```

Do not add automatic order API calls to webhook handlers.

- [ ] **Step 3: Create manual sync service**

Create `lib/services/remonline-order-sync.ts`:

```ts
import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import { OrderService } from "@/app/api/webhooks/remonline/services/order-service"
import { recordOrderSyncIssue, resolveOrderSyncIssues } from "@/lib/services/remonline-order-sync-issues"

type SyncOrderResult = {
  success: boolean
  message?: string
  order?: any
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error || "Failed to sync order")
}

function getOrderClientId(order: any): number | null {
  const rawId = order?.client?.id ?? order?.client_id ?? order?.customer?.id
  const id = Number(rawId)
  return Number.isFinite(id) ? id : null
}

export async function syncOrderFromRemonline(remonlineOrderId: number, adminUserId?: string): Promise<SyncOrderResult> {
  try {
    const orderResult = await remonline.getOrderById(remonlineOrderId)

    if (!orderResult.success || !orderResult.order) {
      return {
        success: false,
        message: orderResult.message || "Failed to fetch order from RemOnline",
      }
    }

    const itemsResult = await remonline.getOrderItems(remonlineOrderId)
    if (!itemsResult.success) {
      return {
        success: false,
        message: itemsResult.message || "Failed to fetch order items from RemOnline",
      }
    }

    const clientId = getOrderClientId(orderResult.order)
    if (!clientId) {
      await recordOrderSyncIssue({
        payload: { id: `manual:${remonlineOrderId}`, event_name: "Manual.Order.Sync", context: { object_id: remonlineOrderId } },
        reason: "client_not_linked",
        details: "RemOnline order response did not include a client id",
      })
      return { success: false, message: "RemOnline order response did not include a client id" }
    }

    const supabase = createClient()
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("remonline_id", clientId)
      .maybeSingle()

    if (userError) {
      return { success: false, message: `Failed to find local user: ${userError.message}` }
    }

    if (!user) {
      await recordOrderSyncIssue({
        payload: { id: `manual:${remonlineOrderId}`, event_name: "Manual.Order.Sync", context: { object_id: remonlineOrderId }, metadata: { client: { id: clientId } } },
        reason: "client_not_linked",
        details: `No local user found for RemOnline client ${clientId}`,
        supabase,
      })
      return { success: false, message: `No local user found for RemOnline client ${clientId}` }
    }

    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromRemonlineApi(
      user.id,
      remonlineOrderId,
      orderResult.order,
      itemsResult.items || [],
    )

    await resolveOrderSyncIssues(remonlineOrderId, adminUserId, supabase)

    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs tests/remonline-invoice-sync.test.mjs tests/remonline-rate-limit.test.mjs
```

Expected: manual sync tests still fail until the admin route exists; no existing RemOnline tests regress.

- [ ] **Step 5: Commit partial service work**

```powershell
git add lib/services/remonline-order-sync.ts lib/api/remonline.ts app/api/webhooks/remonline/services/order-service.ts tests/remonline-order-sync.test.mjs
git commit -m "feat: add remonline order sync service"
```

---

### Task 7: Add Admin Manual Sync and Issue API Routes

**Files:**
- Create: `app/api/admin/remonline/orders/[id]/sync/route.ts`
- Create: `app/api/admin/remonline/order-sync-issues/route.ts`
- Create: `app/api/admin/remonline/order-sync-issues/[id]/route.ts`
- Test: `tests/remonline-order-sync.test.mjs`

- [ ] **Step 1: Create manual sync route**

Create `app/api/admin/remonline/orders/[id]/sync/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncOrderFromRemonline } from "@/lib/services/remonline-order-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const remonlineOrderId = Number(id)

  if (!Number.isInteger(remonlineOrderId) || remonlineOrderId <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  const result = await syncOrderFromRemonline(remonlineOrderId, session.user.id)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Create issue list route**

Create `app/api/admin/remonline/order-sync-issues/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listOrderSyncIssues } from "@/lib/services/remonline-order-sync-issues"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") === "ignored" || searchParams.get("status") === "resolved"
    ? searchParams.get("status")
    : "open"

  const issues = await listOrderSyncIssues(status)
  return NextResponse.json({ success: true, issues })
}
```

- [ ] **Step 3: Create ignore route**

Create `app/api/admin/remonline/order-sync-issues/[id]/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { ignoreOrderSyncIssue } from "@/lib/services/remonline-order-sync-issues"

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const issue = await ignoreOrderSyncIssue(id, session.user.id)
  return NextResponse.json({ success: true, issue })
}
```

- [ ] **Step 4: Extend route tests**

Append to `tests/remonline-order-sync.test.mjs`:

```js
test("admin order sync issue APIs are admin-only", async () => {
  const listRoute = await read("../app/api/admin/remonline/order-sync-issues/route.ts")
  const issueRoute = await read("../app/api/admin/remonline/order-sync-issues/[id]/route.ts")

  assert.match(listRoute, /getSession/)
  assert.match(listRoute, /session\.user\.role !== "admin"/)
  assert.match(listRoute, /listOrderSyncIssues/)
  assert.match(issueRoute, /getSession/)
  assert.match(issueRoute, /session\.user\.role !== "admin"/)
  assert.match(issueRoute, /ignoreOrderSyncIssue/)
})
```

- [ ] **Step 5: Run tests**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: all tests in the new file pass.

- [ ] **Step 6: Commit**

```powershell
git add app/api/admin/remonline/orders/[id]/sync/route.ts app/api/admin/remonline/order-sync-issues/route.ts app/api/admin/remonline/order-sync-issues/[id]/route.ts tests/remonline-order-sync.test.mjs
git commit -m "feat: add admin remonline order sync api"
```

---

### Task 8: Add Admin Issue Inbox UI Tests

**Files:**
- Modify: `tests/remonline-order-sync.test.mjs`
- Create later: `components/admin/remonline-order-sync-issues.tsx`
- Create later: `app/[locale]/admin/remonline-orders/page.tsx`
- Modify later: `components/admin/admin-sidebar.tsx`
- Modify later: `messages/uk.json`, `messages/cs.json`, `messages/en.json`

- [ ] **Step 1: Add failing UI source tests**

Append:

```js
test("admin UI exposes RemOnline order sync issues without user profile sync controls", async () => {
  const component = await read("../components/admin/remonline-order-sync-issues.tsx")
  const page = await read("../app/[locale]/admin/remonline-orders/page.tsx")
  const sidebar = await read("../components/admin/admin-sidebar.tsx")
  const profile = await read("../app/[locale]/profile/profile-content.tsx")
  const uk = await read("../messages/uk.json")
  const cs = await read("../messages/cs.json")
  const en = await read("../messages/en.json")

  assert.match(component, /\/api\/admin\/remonline\/order-sync-issues/)
  assert.match(component, /\/api\/admin\/remonline\/orders\/\$\{issue\.remonline_order_id\}\/sync/)
  assert.match(component, /Sync order/)
  assert.match(component, /Ignore/)
  assert.match(page, /RemonlineOrderSyncIssues/)
  assert.match(sidebar, /\/admin\/remonline-orders/)
  assert.match(uk, /remonlineOrderSync/)
  assert.match(cs, /remonlineOrderSync/)
  assert.match(en, /remonlineOrderSync/)
  assert.doesNotMatch(profile, /remonline\/orders|Sync order|order-sync-issues/)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs
```

Expected: FAIL because the UI component/page do not exist.

- [ ] **Step 3: Commit failing UI tests**

```powershell
git add tests/remonline-order-sync.test.mjs
git commit -m "test: define admin remonline order sync ui"
```

---

### Task 9: Implement Admin Issue Inbox UI

**Files:**
- Create: `components/admin/remonline-order-sync-issues.tsx`
- Create: `app/[locale]/admin/remonline-orders/page.tsx`
- Modify: `components/admin/admin-sidebar.tsx`
- Modify: `messages/uk.json`, `messages/cs.json`, `messages/en.json`
- Test: `tests/remonline-order-sync.test.mjs`

- [ ] **Step 1: Create admin inbox component**

Create `components/admin/remonline-order-sync-issues.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"

type OrderSyncIssue = {
  id: string
  event_name: string
  remonline_order_id: number | null
  remonline_client_id: number | null
  reason: string
  details: string | null
  attempts: number
  last_seen_at: string
  status: "open" | "resolved" | "ignored"
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export function RemonlineOrderSyncIssues() {
  const [issues, setIssues] = useState<OrderSyncIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function loadIssues() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/remonline/order-sync-issues?status=open")
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to load issues")
      setIssues(data.issues || [])
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load RemOnline order issues",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function syncOrder(issue: OrderSyncIssue) {
    if (!issue.remonline_order_id) return
    setBusyId(issue.id)
    try {
      const response = await fetch(`/api/admin/remonline/orders/${issue.remonline_order_id}/sync`, { method: "POST" })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.message || data.error || "Order sync failed")
      toast({ title: "Success", description: "Order synced from RemOnline" })
      await loadIssues()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Order sync failed",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  async function ignoreIssue(issue: OrderSyncIssue) {
    setBusyId(issue.id)
    try {
      const response = await fetch(`/api/admin/remonline/order-sync-issues/${issue.id}`, { method: "PATCH" })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to ignore issue")
      toast({ title: "Success", description: "Issue ignored" })
      await loadIssues()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to ignore issue",
        variant: "destructive",
      })
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    loadIssues()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <AlertTriangle className="h-5 w-5" />
          RemOnline order sync
        </CardTitle>
        <Button variant="outline" onClick={loadIssues} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell><Badge variant="outline">{issue.event_name}</Badge></TableCell>
                  <TableCell>{issue.remonline_order_id || "-"}</TableCell>
                  <TableCell>{issue.remonline_client_id || "-"}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={issue.details || issue.reason}>
                    {issue.reason}
                  </TableCell>
                  <TableCell>{issue.attempts}</TableCell>
                  <TableCell>{formatDate(issue.last_seen_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => syncOrder(issue)}
                        disabled={!issue.remonline_order_id || busyId === issue.id}
                      >
                        {busyId === issue.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Sync order
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => ignoreIssue(issue)} disabled={busyId === issue.id}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Ignore
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No open RemOnline order sync issues
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create admin page**

Create `app/[locale]/admin/remonline-orders/page.tsx`:

```tsx
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RemonlineOrderSyncIssues } from "@/components/admin/remonline-order-sync-issues"

export const metadata: Metadata = {
  title: "RemOnline Order Sync",
  description: "Resolve RemOnline order synchronization issues",
}

export default async function RemonlineOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Admin" })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("remonlineOrderSync")}</h2>
        <p className="text-muted-foreground">{t("remonlineOrderSyncDescription")}</p>
      </div>
      <RemonlineOrderSyncIssues />
    </div>
  )
}
```

- [ ] **Step 3: Add sidebar navigation**

In `components/admin/admin-sidebar.tsx`, add `AlertTriangle` to lucide imports and insert:

```ts
{
  title: "RemOnline orders",
  href: "/admin/remonline-orders",
  icon: AlertTriangle,
},
```

Place it next to the existing sync/order-status admin items.

- [ ] **Step 4: Add translations**

Add these keys under the `Admin` object in all three message files:

```json
"remonlineOrderSync": "RemOnline order sync",
"remonlineOrderSyncDescription": "Review failed RemOnline order webhook events and manually sync orders."
```

Use Ukrainian and Czech equivalents in `uk.json` and `cs.json`.

- [ ] **Step 5: Run tests**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs tests/remonline-admin-ui.test.mjs
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add components/admin/remonline-order-sync-issues.tsx app/[locale]/admin/remonline-orders/page.tsx components/admin/admin-sidebar.tsx messages/uk.json messages/cs.json messages/en.json tests/remonline-order-sync.test.mjs
git commit -m "feat: add remonline order sync admin inbox"
```

---

### Task 10: Apply Migration and Verify End to End

**Files:**
- SQL: `scripts/create-remonline-order-sync-issues-table.sql`
- Verification only unless a bug is found.

- [ ] **Step 1: Apply the SQL migration**

Use the same direct Postgres approach used for `scripts/create-user-invoices-table.sql`, with connection values loaded from `.env`, and do not print secrets.

Run a temporary Node script with `pg` from a temp install if local `psql` is unavailable. It should execute:

```sql
\i scripts/create-remonline-order-sync-issues-table.sql
```

or the equivalent `client.query(sql)` call.

Expected verification query:

```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'remonline_order_sync_issues';
```

Expected: count is greater than 0.

- [ ] **Step 2: Run focused automated tests**

Run:

```powershell
node --test tests/remonline-order-sync.test.mjs tests/remonline-invoice-sync.test.mjs tests/remonline-webhook-security.test.mjs tests/remonline-sync-source.test.mjs tests/remonline-rate-limit.test.mjs tests/remonline-admin-ui.test.mjs tests/remonline-contact-payload.test.mjs tests/orders-translations.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Run build and TypeScript**

Run:

```powershell
npm run build
npx tsc --noEmit
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Manually test the admin UI locally**

Start or reuse a dev server:

```powershell
npm run dev
```

Open `/uk/admin/remonline-orders` in the in-app browser. Verify:

- The page loads without console errors.
- The table fits the viewport on desktop and mobile widths.
- The refresh button does not shift layout.
- The action buttons remain visible in horizontal overflow.
- No order sync controls appear in the user profile.

- [ ] **Step 5: Commit verification fixes only when verification changed files**

If verification required code changes, run:

```powershell
git status --short
```

Stage the exact changed files reported by `git status --short`, then commit:

```powershell
git commit -m "fix: stabilize remonline order sync verification"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review Checklist

- Spec coverage: migration, issue recording, admin manual sync, admin UI, no profile sync controls, and verification are all covered by tasks.
- Completion marker scan: no unfinished markers are intentionally present.
- Type consistency: service names are `recordOrderSyncIssue`, `resolveOrderSyncIssues`, `ignoreOrderSyncIssue`, `listOrderSyncIssues`, and `syncOrderFromRemonline`; route tests refer to those same names.
- Boundary check: webhook handlers remain payload-first; only `lib/services/remonline-order-sync.ts` calls `remonline.getOrderById` and `remonline.getOrderItems`.
