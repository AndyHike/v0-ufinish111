# RemOnline Invoice Sync Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local invoice sync foundation for RO App while keeping webhooks payload-first and allowing full RO App API reads only from explicit admin "Sync now" actions.

**Architecture:** The canonical `/api/webhooks/remonline` route keeps using `REMONLINE_WEBHOOK_SECRET`, then routes `Invoice.*` events to a handler that only normalizes and stores the received payload. Manual admin sync calls the RO App API through `lib/api/remonline.ts`, then stores the result through the same invoice service with `sync_source = 'manual'`. User-facing invoice reads use local Supabase tables only.

**Tech Stack:** Next.js App Router, TypeScript, Supabase service client, PostgreSQL SQL scripts, `node:test`, RO App Public API.

---

## Context

RO App currently documents invoice reads at `GET https://api.roapp.io/v2/invoices` with filters such as `ids`, `numbers`, `client_ids`, `payer_ids`, `created_at`, `modified_at`, `issue_date`, and `due_date`: https://roappua.readme.io/reference/get-invoices

The RO App help center also notes that invoice API responses include issue date, due date, manager, and payer fields: https://help.roapp.io/en/articles/10358845-invoices-variables-for-print-documents-customizing-statuses-and-more

The agreed product rule is:

- Webhooks apply their payload only.
- Webhooks do not call RO App API for enrichment.
- Manual admin sync can call RO App API.
- No scheduled polling.
- No scraping or browser automation.
- One webhook secret remains `REMONLINE_WEBHOOK_SECRET`.

## File Structure

Create:

- `scripts/create-user-invoices-table.sql` - local invoice table, sync state, payload audit data, indexes, RLS policies.
- `app/api/webhooks/remonline/services/invoice-service.ts` - invoice payload normalization and Supabase writes. This file must not import `@/lib/api/remonline`.
- `app/api/webhooks/remonline/handlers/invoice-handler.ts` - webhook event switch for `Invoice.Created`, `Invoice.Deleted`, and future `Invoice.Updated`.
- `lib/services/remonline-invoice-sync.ts` - manual sync service that calls RO App API and writes via `InvoiceService`.
- `app/api/admin/remonline/invoices/[id]/sync/route.ts` - admin-only manual sync endpoint for one invoice.
- `app/api/user/invoices/route.ts` - authenticated user endpoint that reads local invoices only.
- `tests/remonline-invoice-sync.test.mjs` - source-level tests for invoice schema, webhook routing, payload-first safety, and manual sync boundaries.

Modify:

- `app/api/webhooks/remonline/route.ts` - extend schema for invoice metadata and route `Invoice.*` events.
- `lib/api/remonline.ts` - add `getInvoiceById(id)` using `GET /invoices?ids=<id>` through the RO App v2 client.
- `app/api/webhooks/remonline/handlers/order-handler.ts` - remove automatic RO App API calls from `Order.Created` and `Order.Updated`.
- `app/api/webhooks/remonline/services/order-service.ts` - add a payload-only upsert method for order webhooks.

## Task 1: Add Invoice Sync Safety Tests

**Files:**

- Create: `tests/remonline-invoice-sync.test.mjs`

- [ ] **Step 1: Create the failing source-level test file**

Create `tests/remonline-invoice-sync.test.mjs` with this full content:

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

test("invoice migration stores local invoice data and sync state", async () => {
  const sql = await read("../scripts/create-user-invoices-table.sql")

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.user_invoices/)
  assert.match(sql, /remonline_invoice_id INTEGER UNIQUE NOT NULL/)
  assert.match(sql, /user_id UUID REFERENCES public\.users\(id\) ON DELETE SET NULL/)
  assert.match(sql, /invoice_number TEXT NOT NULL/)
  assert.match(sql, /client_id INTEGER/)
  assert.match(sql, /payer_id INTEGER/)
  assert.match(sql, /issue_date TIMESTAMP WITH TIME ZONE/)
  assert.match(sql, /due_date TIMESTAMP WITH TIME ZONE/)
  assert.match(sql, /total_amount NUMERIC\(12,2\)/)
  assert.match(sql, /raw_payload JSONB NOT NULL DEFAULT '\{\}'::jsonb/)
  assert.match(sql, /sync_source TEXT NOT NULL DEFAULT 'webhook'/)
  assert.match(sql, /sync_status TEXT NOT NULL DEFAULT 'synced'/)
  assert.match(sql, /is_deleted BOOLEAN NOT NULL DEFAULT FALSE/)
  assert.match(sql, /idx_user_invoices_user_id/)
  assert.match(sql, /idx_user_invoices_remonline_invoice_id/)
  assert.match(sql, /idx_user_invoices_client_id/)
  assert.match(sql, /Users can view their own invoices/)
})

test("invoice webhook route is canonical and routes invoice events after signature verification", async () => {
  const route = await read("../app/api/webhooks/remonline/route.ts")

  assert.match(route, /REMONLINE_WEBHOOK_SECRET/)
  assert.match(route, /verifyRemonlineWebhookSignature/)
  assert.match(route, /handleInvoiceEvents/)
  assert.match(route, /eventType\.startsWith\("Invoice\."\)/)
  assert.ok(route.indexOf("verifyRemonlineWebhookSignature({ payload") < route.indexOf("return await handleInvoiceEvents"))
})

test("invoice webhook handler is payload-first and never imports the RO App API client", async () => {
  const handlerPath = "../app/api/webhooks/remonline/handlers/invoice-handler.ts"
  assert.equal(await pathExists(handlerPath), true)

  const handler = await read(handlerPath)

  assert.match(handler, /export async function handleInvoiceEvents/)
  assert.match(handler, /Invoice\.Created/)
  assert.match(handler, /Invoice\.Deleted/)
  assert.match(handler, /Invoice\.Updated/)
  assert.match(handler, /upsertInvoiceFromPayload/)
  assert.match(handler, /markInvoiceDeleted/)
  assert.doesNotMatch(handler, /@\/lib\/api\/remonline/)
  assert.doesNotMatch(handler, /getInvoiceById/)
  assert.doesNotMatch(handler, /makeRequest/)
  assert.doesNotMatch(handler, /makeRoAppRequest/)
})

test("invoice service preserves payload-first boundaries", async () => {
  const service = await read("../app/api/webhooks/remonline/services/invoice-service.ts")

  assert.match(service, /export function normalizeInvoicePayload/)
  assert.match(service, /export class InvoiceService/)
  assert.match(service, /async upsertInvoiceFromPayload/)
  assert.match(service, /async markInvoiceDeleted/)
  assert.match(service, /raw_payload/)
  assert.match(service, /sync_source/)
  assert.doesNotMatch(service, /@\/lib\/api\/remonline/)
  assert.doesNotMatch(service, /getInvoiceById/)
  assert.doesNotMatch(service, /fetch\(/)
})

test("manual invoice sync is the only invoice path that calls RO App API", async () => {
  const syncService = await read("../lib/services/remonline-invoice-sync.ts")
  const adminRoute = await read("../app/api/admin/remonline/invoices/[id]/sync/route.ts")
  const apiClient = await read("../lib/api/remonline.ts")

  assert.match(syncService, /remonline\.getInvoiceById\(remonlineInvoiceId\)/)
  assert.match(syncService, /new InvoiceService\(supabase\)/)
  assert.match(syncService, /source: "manual"/)
  assert.match(adminRoute, /getSession/)
  assert.match(adminRoute, /session\.user\.role !== "admin"/)
  assert.match(adminRoute, /syncInvoiceFromRemonline/)
  assert.match(apiClient, /async getInvoiceById/)
  assert.match(apiClient, /\/invoices\?/)
})

test("user invoice endpoint reads local database only", async () => {
  const route = await read("../app/api/user/invoices/route.ts")

  assert.match(route, /getSession/)
  assert.match(route, /\.from\("user_invoices"\)/)
  assert.match(route, /\.eq\("user_id", userId\)/)
  assert.match(route, /\.eq\("is_deleted", false\)/)
  assert.doesNotMatch(route, /@\/lib\/api\/remonline/)
  assert.doesNotMatch(route, /getInvoiceById/)
  assert.doesNotMatch(route, /fetch\(/)
})

test("existing order created and updated webhooks are also payload-first", async () => {
  const handler = await read("../app/api/webhooks/remonline/handlers/order-handler.ts")
  const service = await read("../app/api/webhooks/remonline/services/order-service.ts")

  assert.doesNotMatch(handler, /@\/lib\/api\/remonline/)
  assert.doesNotMatch(handler, /getOrderById/)
  assert.doesNotMatch(handler, /getOrderItems/)
  assert.match(handler, /upsertOrderFromWebhookPayload/)
  assert.match(service, /async upsertOrderFromWebhookPayload/)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL because the migration, invoice service, invoice handler, admin route, user route, and order payload-only method do not exist yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/remonline-invoice-sync.test.mjs
git commit -m "test: define remonline invoice sync boundaries"
```

## Task 2: Add Local Invoice Table Migration

**Files:**

- Create: `scripts/create-user-invoices-table.sql`

- [ ] **Step 1: Create the invoice table SQL script**

Create `scripts/create-user-invoices-table.sql` with this full content:

```sql
-- Create local invoice cache for RO App invoices.
CREATE TABLE IF NOT EXISTS public.user_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    remonline_invoice_id INTEGER UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    status_id INTEGER,
    status_name TEXT,
    status_group TEXT,
    issue_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at_remonline TIMESTAMP WITH TIME ZONE,
    modified_at_remonline TIMESTAMP WITH TIME ZONE,
    payment_method TEXT,
    client_id INTEGER,
    client_name TEXT,
    payer_id INTEGER,
    payer_name TEXT,
    manager_id INTEGER,
    manager_name TEXT,
    subtotal_amount NUMERIC(12,2),
    discount_amount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2),
    balance_amount NUMERIC(12,2),
    currency TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    sync_source TEXT NOT NULL DEFAULT 'webhook'
        CHECK (sync_source IN ('webhook', 'manual')),
    sync_status TEXT NOT NULL DEFAULT 'synced'
        CHECK (sync_status IN ('synced', 'error')),
    sync_error TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_invoices_user_id ON public.user_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_remonline_invoice_id ON public.user_invoices(remonline_invoice_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_client_id ON public.user_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_payer_id ON public.user_invoices(payer_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_issue_date ON public.user_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_user_invoices_due_date ON public.user_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_user_invoices_status_id ON public.user_invoices(status_id);
CREATE INDEX IF NOT EXISTS idx_user_invoices_is_deleted ON public.user_invoices(is_deleted);

ALTER TABLE public.user_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.user_invoices;
CREATE POLICY "Users can view their own invoices" ON public.user_invoices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage invoices" ON public.user_invoices;
CREATE POLICY "Service can manage invoices" ON public.user_invoices
    FOR ALL USING (true);
```

- [ ] **Step 2: Run the invoice test again**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL with the migration assertions passing and later file assertions still failing.

- [ ] **Step 3: Commit the migration**

```bash
git add scripts/create-user-invoices-table.sql
git commit -m "feat: add remonline invoice table migration"
```

## Task 3: Add Payload-Only Invoice Service

**Files:**

- Create: `app/api/webhooks/remonline/services/invoice-service.ts`

- [ ] **Step 1: Create the invoice normalization and persistence service**

Create `app/api/webhooks/remonline/services/invoice-service.ts` with this full content:

```ts
type InvoiceSyncSource = "webhook" | "manual"

type InvoicePayloadOptions = {
  source?: InvoiceSyncSource
}

type JsonRecord = Record<string, any>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown): string | null {
  if (typeof value === "string") return value
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function toDateText(value: unknown): string | null {
  const text = toText(value)
  if (!text) return null
  const parsed = Date.parse(text)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined)
}

function getNestedId(value: unknown): number | null {
  if (isRecord(value)) return toNumber(value.id)
  return toNumber(value)
}

function getNestedName(value: unknown): string | null {
  if (!isRecord(value)) return null
  return toText(value.name) ?? toText(value.fullname) ?? toText(value.full_name) ?? toText(value.title)
}

function extractInvoicePayload(input: JsonRecord): JsonRecord {
  const metadataInvoice = input.metadata?.invoice
  if (isRecord(metadataInvoice)) return metadataInvoice

  const directInvoice = input.invoice
  if (isRecord(directInvoice)) return directInvoice

  const data = input.data
  if (isRecord(data)) return data

  return input
}

function extractInvoiceId(input: JsonRecord, invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.id, invoice.invoice_id, input.context?.object_id, input.object_id))
}

function extractClientId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.client_id, invoice.clientId, invoice.customer_id, invoice.customerId)) ?? getNestedId(invoice.client) ?? getNestedId(invoice.customer)
}

function extractPayerId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.payer_id, invoice.payerId)) ?? getNestedId(invoice.payer)
}

function extractManagerId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.manager_id, invoice.managerId)) ?? getNestedId(invoice.manager)
}

function extractStatusId(invoice: JsonRecord): number | null {
  return toNumber(firstPresent(invoice.status_id, invoice.statusId)) ?? getNestedId(invoice.status)
}

function extractStatusName(invoice: JsonRecord): string | null {
  return toText(invoice.status_name) ?? toText(invoice.statusName) ?? getNestedName(invoice.status)
}

function extractStatusGroup(invoice: JsonRecord): string | null {
  if (isRecord(invoice.status)) return toText(invoice.status.group) ?? toText(invoice.status.type)
  return toText(invoice.status_group) ?? toText(invoice.statusGroup)
}

function extractAmount(invoice: JsonRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(invoice[key])
    if (value !== null) return value
  }
  return null
}

export function normalizeInvoicePayload(input: JsonRecord, userId: string | null, source: InvoiceSyncSource = "webhook") {
  const invoice = extractInvoicePayload(input)
  const remonlineInvoiceId = extractInvoiceId(input, invoice)

  if (!remonlineInvoiceId) {
    throw new Error("RemOnline invoice id is missing")
  }

  const invoiceNumber = toText(firstPresent(invoice.number, invoice.name, invoice.id_label, invoice.label)) ?? String(remonlineInvoiceId)
  const client = invoice.client ?? invoice.customer
  const payer = invoice.payer
  const manager = invoice.manager
  const now = new Date().toISOString()

  return {
    remonline_invoice_id: remonlineInvoiceId,
    user_id: userId,
    invoice_number: invoiceNumber,
    status_id: extractStatusId(invoice),
    status_name: extractStatusName(invoice),
    status_group: extractStatusGroup(invoice),
    issue_date: toDateText(firstPresent(invoice.issue_date, invoice.issueDate, invoice.issued_at, invoice.issuedAt)),
    due_date: toDateText(firstPresent(invoice.due_date, invoice.dueDate)),
    created_at_remonline: toDateText(firstPresent(invoice.created_at, invoice.createdAt, input.created_at)),
    modified_at_remonline: toDateText(firstPresent(invoice.modified_at, invoice.modifiedAt, invoice.updated_at, invoice.updatedAt)),
    payment_method: toText(firstPresent(invoice.payment_method, invoice.paymentMethod)),
    client_id: extractClientId(invoice),
    client_name: toText(invoice.client_name) ?? toText(invoice.customer_name) ?? getNestedName(client),
    payer_id: extractPayerId(invoice),
    payer_name: toText(invoice.payer_name) ?? getNestedName(payer),
    manager_id: extractManagerId(invoice),
    manager_name: toText(invoice.manager_name) ?? getNestedName(manager),
    subtotal_amount: extractAmount(invoice, "subtotal_amount", "subtotalAmount", "subtotal", "amount_without_discount"),
    discount_amount: extractAmount(invoice, "discount_amount", "discountAmount", "discount"),
    total_amount: extractAmount(invoice, "total_amount", "totalAmount", "total", "sum", "amount"),
    paid_amount: extractAmount(invoice, "paid_amount", "paidAmount", "paid"),
    balance_amount: extractAmount(invoice, "balance_amount", "balanceAmount", "balance", "debt"),
    currency: toText(invoice.currency),
    raw_payload: input,
    sync_source: source,
    sync_status: "synced",
    sync_error: null,
    is_deleted: false,
    last_synced_at: source === "manual" ? now : null,
    updated_at: now,
  }
}

export class InvoiceService {
  constructor(private supabase: any) {}

  private async findUserId(clientId: number | null): Promise<string | null> {
    if (!clientId) return null

    const { data, error } = await this.supabase
      .from("users")
      .select("id")
      .eq("remonline_id", clientId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to find user by RemOnline client id ${clientId}: ${error.message}`)
    }

    return data?.id ?? null
  }

  async upsertInvoiceFromPayload(input: JsonRecord, options: InvoicePayloadOptions = {}) {
    const source = options.source ?? "webhook"
    const invoice = extractInvoicePayload(input)
    const clientId = extractClientId(invoice)
    const userId = await this.findUserId(clientId)
    const row = normalizeInvoicePayload(input, userId, source)

    const { data, error } = await this.supabase
      .from("user_invoices")
      .upsert(row, { onConflict: "remonline_invoice_id" })
      .select("id, remonline_invoice_id, invoice_number, user_id, sync_source, sync_status")
      .single()

    if (error) {
      throw new Error(`Failed to upsert invoice ${row.remonline_invoice_id}: ${error.message}`)
    }

    return data
  }

  async markInvoiceDeleted(remonlineInvoiceId: number) {
    const { data, error } = await this.supabase
      .from("user_invoices")
      .update({
        is_deleted: true,
        sync_status: "synced",
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("remonline_invoice_id", remonlineInvoiceId)
      .select("id, remonline_invoice_id, invoice_number, is_deleted")
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to mark invoice ${remonlineInvoiceId} as deleted: ${error.message}`)
    }

    return data
  }
}
```

- [ ] **Step 2: Run the invoice test**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL with invoice service assertions passing and route/handler/manual endpoint assertions still failing.

- [ ] **Step 3: Commit the invoice service**

```bash
git add app/api/webhooks/remonline/services/invoice-service.ts
git commit -m "feat: add payload-only invoice service"
```

## Task 4: Add Invoice Webhook Handler and Route

**Files:**

- Create: `app/api/webhooks/remonline/handlers/invoice-handler.ts`
- Modify: `app/api/webhooks/remonline/route.ts`

- [ ] **Step 1: Create the invoice webhook handler**

Create `app/api/webhooks/remonline/handlers/invoice-handler.ts` with this full content:

```ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { InvoiceService } from "../services/invoice-service"

function getRemonlineInvoiceId(webhookData: any): number | null {
  const rawId = webhookData?.metadata?.invoice?.id ?? webhookData?.context?.object_id
  const id = Number(rawId)
  return Number.isFinite(id) ? id : null
}

export async function handleInvoiceEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    const supabase = createClient()
    const invoiceService = new InvoiceService(supabase)

    switch (eventType) {
      case "Invoice.Created":
      case "Invoice.Updated": {
        const invoice = await invoiceService.upsertInvoiceFromPayload(webhookData, { source: "webhook" })
        return NextResponse.json({ success: true, message: "Invoice synced from webhook payload", invoice })
      }

      case "Invoice.Deleted": {
        const invoiceId = getRemonlineInvoiceId(webhookData)

        if (!invoiceId) {
          return NextResponse.json({ success: false, error: "No invoice ID found" }, { status: 400 })
        }

        const invoice = await invoiceService.markInvoiceDeleted(invoiceId)
        return NextResponse.json({ success: true, message: "Invoice marked as deleted", invoice })
      }

      default:
        return NextResponse.json({ success: true, message: "Invoice event received but no action taken" })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process invoice event",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Update webhook route imports and metadata schema**

Modify `app/api/webhooks/remonline/route.ts`:

Add this import next to the existing handlers:

```ts
import { handleInvoiceEvents } from "./handlers/invoice-handler"
```

Inside the `metadata: z.object({ ... })` block, add these optional invoice fields:

```ts
      invoice: z
        .object({
          id: z.number().optional(),
          number: z.string().optional(),
          name: z.string().optional(),
          status: z
            .object({
              id: z.number().optional(),
              name: z.string().optional(),
              title: z.string().optional(),
              group: z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      payer: z
        .object({
          id: z.number().optional(),
          fullname: z.string().optional(),
          name: z.string().optional(),
          full_name: z.string().optional(),
        })
        .passthrough()
        .optional(),
      manager: z
        .object({
          id: z.number().optional(),
          full_name: z.string().optional(),
          name: z.string().optional(),
        })
        .passthrough()
        .optional(),
```

After the client route block, add the invoice route block:

```ts
    if (eventType.startsWith("Invoice.")) {
      console.log("Routing to invoice handler...")
      return await handleInvoiceEvents(webhookData)
    }
```

- [ ] **Step 3: Run the invoice test**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL with route and invoice handler assertions passing. Manual sync and user endpoint assertions still fail.

- [ ] **Step 4: Commit the webhook handler and route**

```bash
git add app/api/webhooks/remonline/handlers/invoice-handler.ts app/api/webhooks/remonline/route.ts
git commit -m "feat: route remonline invoice webhooks"
```

## Task 5: Add Manual Invoice Sync API Read Path

**Files:**

- Modify: `lib/api/remonline.ts`
- Create: `lib/services/remonline-invoice-sync.ts`
- Create: `app/api/admin/remonline/invoices/[id]/sync/route.ts`

- [ ] **Step 1: Add invoice response type and API method**

In `lib/api/remonline.ts`, add this interface after `interface OrderResponse`:

```ts
interface InvoiceResponse {
  success: boolean
  invoice?: any
  message?: string
}
```

Add this private helper near other response helpers:

```ts
  private getFirstListItem(data: any): any | null {
    if (Array.isArray(data)) return data[0] ?? null
    if (Array.isArray(data?.data)) return data.data[0] ?? null
    if (Array.isArray(data?.items)) return data.items[0] ?? null
    return data ?? null
  }
```

Add this public method before `getOrders`:

```ts
  async getInvoiceById(invoiceId: number): Promise<InvoiceResponse> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.append("ids", String(invoiceId))

      const result = await this.makeRoAppRequest(`/invoices?${searchParams.toString()}`)

      if (!result.success) {
        return {
          success: false,
          message: result.message || "Failed to fetch invoice",
        }
      }

      const invoice = this.getFirstListItem(result.data)

      if (!invoice) {
        return {
          success: false,
          message: `Invoice ${invoiceId} was not found`,
        }
      }

      return {
        success: true,
        invoice,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch invoice",
      }
    }
  }
```

- [ ] **Step 2: Create the manual sync service**

Create `lib/services/remonline-invoice-sync.ts` with this full content:

```ts
import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import { InvoiceService } from "@/app/api/webhooks/remonline/services/invoice-service"

export async function syncInvoiceFromRemonline(remonlineInvoiceId: number) {
  const result = await remonline.getInvoiceById(remonlineInvoiceId)

  if (!result.success || !result.invoice) {
    return {
      success: false,
      message: result.message || "Failed to fetch invoice from RO App",
    }
  }

  const supabase = createClient()
  const invoiceService = new InvoiceService(supabase)

  const invoice = await invoiceService.upsertInvoiceFromPayload(
    {
      id: `manual-invoice-sync-${remonlineInvoiceId}-${Date.now()}`,
      created_at: new Date().toISOString(),
      event_name: "Invoice.ManualSync",
      context: {
        object_id: remonlineInvoiceId,
        object_type: "invoice",
      },
      metadata: {
        invoice: result.invoice,
      },
    },
    { source: "manual" },
  )

  return {
    success: true,
    invoice,
  }
}
```

- [ ] **Step 3: Create the admin manual sync route**

Create `app/api/admin/remonline/invoices/[id]/sync/route.ts` with this full content:

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { syncInvoiceFromRemonline } from "@/lib/services/remonline-invoice-sync"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rawId = (await params).id
  const remonlineInvoiceId = Number(rawId)

  if (!Number.isFinite(remonlineInvoiceId) || remonlineInvoiceId <= 0) {
    return NextResponse.json({ success: false, error: "Invalid invoice id" }, { status: 400 })
  }

  const result = await syncInvoiceFromRemonline(remonlineInvoiceId)

  if (!result.success) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
```

- [ ] **Step 4: Run the invoice test**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL with manual sync assertions passing. User invoice endpoint and order payload-first assertions still fail.

- [ ] **Step 5: Commit manual sync**

```bash
git add lib/api/remonline.ts lib/services/remonline-invoice-sync.ts app/api/admin/remonline/invoices/[id]/sync/route.ts
git commit -m "feat: add manual remonline invoice sync"
```

## Task 6: Add User Local Invoice Read Endpoint

**Files:**

- Create: `app/api/user/invoices/route.ts`

- [ ] **Step 1: Create the authenticated user invoice endpoint**

Create `app/api/user/invoices/route.ts` with this full content:

```ts
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

function toAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = createClient()

    const { data: invoices, error } = await supabase
      .from("user_invoices")
      .select(
        `
        id,
        remonline_invoice_id,
        invoice_number,
        status_id,
        status_name,
        status_group,
        issue_date,
        due_date,
        payment_method,
        client_name,
        payer_name,
        manager_name,
        total_amount,
        paid_amount,
        balance_amount,
        currency,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("issue_date", { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoices: (invoices || []).map((invoice) => ({
        id: invoice.id,
        remonlineInvoiceId: invoice.remonline_invoice_id,
        number: invoice.invoice_number,
        statusId: invoice.status_id,
        statusName: invoice.status_name,
        statusGroup: invoice.status_group,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentMethod: invoice.payment_method,
        clientName: invoice.client_name,
        payerName: invoice.payer_name,
        managerName: invoice.manager_name,
        totalAmount: toAmount(invoice.total_amount),
        paidAmount: toAmount(invoice.paid_amount),
        balanceAmount: toAmount(invoice.balance_amount),
        currency: invoice.currency,
        updatedAt: invoice.updated_at,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Run the invoice test**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: FAIL with the user invoice endpoint assertions passing. The remaining failure is the existing order webhook auto-fetch guard.

- [ ] **Step 3: Commit the user invoice endpoint**

```bash
git add app/api/user/invoices/route.ts
git commit -m "feat: expose local user invoices"
```

## Task 7: Align Existing Order Webhooks With Payload-First Rule

**Files:**

- Modify: `app/api/webhooks/remonline/handlers/order-handler.ts`
- Modify: `app/api/webhooks/remonline/services/order-service.ts`

- [ ] **Step 1: Add a payload-only upsert method to `OrderService`**

In `app/api/webhooks/remonline/services/order-service.ts`, add this method inside the `OrderService` class before `deleteOrder`:

```ts
  async upsertOrderFromWebhookPayload(webhookData: any): Promise<any> {
    const remonlineOrderId = Number(webhookData?.context?.object_id)
    const clientId = Number(webhookData?.metadata?.client?.id)

    if (!Number.isFinite(remonlineOrderId)) {
      throw new Error("RemOnline order id is missing")
    }

    if (!Number.isFinite(clientId)) {
      throw new Error("RemOnline client id is missing")
    }

    const { data: user, error: userError } = await this.supabase
      .from("users")
      .select("id, locale")
      .eq("remonline_id", clientId)
      .maybeSingle()

    if (userError) {
      throw new Error(`Failed to find user by RemOnline client id ${clientId}: ${userError.message}`)
    }

    if (!user) {
      throw new Error(`User with RemOnline client id ${clientId} was not found`)
    }

    const { data: existingOrder, error: existingError } = await this.supabase
      .from("user_repair_orders")
      .select(
        `
        id,
        document_id,
        creation_date,
        device_serial_number,
        device_name,
        device_brand,
        device_model,
        total_amount,
        overall_status,
        overall_status_name,
        overall_status_color
      `,
      )
      .eq("remonline_order_id", remonlineOrderId)
      .maybeSingle()

    if (existingError) {
      throw new Error(`Failed to read existing order ${remonlineOrderId}: ${existingError.message}`)
    }

    const order = webhookData?.metadata?.order || {}
    const asset = webhookData?.metadata?.asset || {}
    const statusId = webhookData?.metadata?.status?.id ?? webhookData?.metadata?.new?.id
    const statusInfo = statusId ? await getStatusByRemOnlineId(statusId, user.locale || "uk", true) : null

    const baseRow = {
      remonline_order_id: remonlineOrderId,
      user_id: user.id,
      document_id: order.name || order.id_label || existingOrder?.document_id || String(remonlineOrderId),
      creation_date: existingOrder?.creation_date || webhookData?.created_at || new Date().toISOString(),
      device_serial_number: asset.uid || asset.serial_number || existingOrder?.device_serial_number || "N/A",
      device_name: asset.name || existingOrder?.device_name || "Unknown",
      device_brand: asset.brand || existingOrder?.device_brand || null,
      device_model: asset.model || existingOrder?.device_model || null,
      total_amount: existingOrder?.total_amount || 0,
      overall_status: statusId ? String(statusId) : existingOrder?.overall_status || "unknown",
      overall_status_name: statusInfo?.name || existingOrder?.overall_status_name || "Unknown",
      overall_status_color: statusInfo?.color || existingOrder?.overall_status_color || "#6b7280",
      updated_at: new Date().toISOString(),
    }

    if (existingOrder) {
      const { error: updateError } = await this.supabase
        .from("user_repair_orders")
        .update(baseRow)
        .eq("remonline_order_id", remonlineOrderId)

      if (updateError) {
        throw new Error(`Failed to update order ${remonlineOrderId}: ${updateError.message}`)
      }

      return existingOrder
    }

    const { data: newOrder, error: insertError } = await this.supabase
      .from("user_repair_orders")
      .insert({
        ...baseRow,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (insertError) {
      throw new Error(`Failed to create order ${remonlineOrderId}: ${insertError.message}`)
    }

    return newOrder
  }
```

- [ ] **Step 2: Replace `Order.Created` webhook implementation**

In `app/api/webhooks/remonline/handlers/order-handler.ts`, remove this import:

```ts
import remonline from "@/lib/api/remonline"
```

Replace the body of `handleOrderCreated` with:

```ts
async function handleOrderCreated(webhookData: any) {
  try {
    const supabase = createClient()
    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromWebhookPayload(webhookData)

    return NextResponse.json({ success: true, message: "Order synced from webhook payload", order })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order from webhook payload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 3: Replace `Order.Updated` webhook implementation**

In `app/api/webhooks/remonline/handlers/order-handler.ts`, replace the body of `handleOrderUpdated` with:

```ts
async function handleOrderUpdated(webhookData: any) {
  try {
    const supabase = createClient()
    const orderService = new OrderService(supabase)
    const order = await orderService.upsertOrderFromWebhookPayload(webhookData)

    return NextResponse.json({ success: true, message: "Order updated from webhook payload", order })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order from webhook payload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 4: Run the invoice safety test**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run existing RemOnline tests**

Run:

```bash
node --test tests/remonline-webhook-security.test.mjs tests/remonline-sync-source.test.mjs tests/remonline-rate-limit.test.mjs tests/remonline-account-schema.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit the order webhook alignment**

```bash
git add app/api/webhooks/remonline/handlers/order-handler.ts app/api/webhooks/remonline/services/order-service.ts tests/remonline-invoice-sync.test.mjs
git commit -m "fix: keep remonline webhooks payload-first"
```

## Task 8: Final Verification

**Files:**

- Verify all changed files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test tests/remonline-invoice-sync.test.mjs tests/remonline-webhook-security.test.mjs tests/remonline-sync-source.test.mjs tests/remonline-rate-limit.test.mjs tests/remonline-account-schema.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: PASS. If it fails because of unrelated existing build issues, capture the first unrelated error and run at least `npx tsc --noEmit` if available.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff --stat HEAD~7..HEAD
git status --short
```

Expected: only invoice sync, RemOnline route, and payload-first order webhook files are changed. Working tree is clean after the final commit.

## Self-Review

Spec coverage:

- Invoice table and local read model: Task 2 and Task 6.
- Invoice webhook payload-only path: Task 3 and Task 4.
- Manual invoice sync with RO App API: Task 5.
- Single webhook endpoint and single secret: Task 4 extends the existing canonical route without adding secrets.
- No automatic API fetch from webhook: Task 3 guards invoice service, Task 4 keeps invoice handler payload-only, Task 7 fixes existing order created/updated handlers.
- No polling or scraping: no task adds scheduled jobs, browser automation, or scraping.

Placeholder scan:

- No unresolved placeholder markers or vague error-handling instructions.
- Every created file has full content.
- Modified files include exact methods or snippets to insert.

Type consistency:

- `InvoiceService.upsertInvoiceFromPayload(input, { source })` is used by both webhook and manual sync.
- `syncInvoiceFromRemonline(remonlineInvoiceId)` is used by the admin route.
- `getInvoiceById(invoiceId)` returns `InvoiceResponse` and uses the RO App `/invoices?ids=<id>` list endpoint.
