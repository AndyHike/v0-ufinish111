# RemOnline Payload-First Sync Design

## Goal

Build the next RemOnline integration steps around one predictable rule: webhooks apply the payload they receive, while RO App API reads happen only from an explicit manual "Sync now" action.

## Current Decisions

- The canonical webhook endpoint is `/api/webhooks/remonline`.
- The webhook endpoint uses one shared secret: `REMONLINE_WEBHOOK_SECRET`.
- `REMONLINE_API_KEY` remains separate and is used only for authenticated RO App API calls.
- RemOnline/RO App currently lacks update webhooks for edited clients, invoices, and some document changes.
- Future update webhooks may be added by RemOnline, but there is no reliable delivery date.

## Architecture

The integration has two separate write paths.

### Webhook Payload Path

RemOnline sends an event to `/api/webhooks/remonline`.

The route:

1. Reads the raw request body.
2. Parses JSON.
3. Verifies `X-Signature` with `REMONLINE_WEBHOOK_SECRET`.
4. Routes by `event_name`.
5. Normalizes the received payload.
6. Upserts or deletes local records using only fields present in the webhook payload.

The webhook path must not call the RemOnline API for enrichment.

This avoids unnecessary API requests, respects the 3 requests/second RO App limit, and prevents ambiguous behavior when a webhook field is empty. Empty fields in the payload are treated as received data, not as a signal to fetch more data.

### Manual Sync Path

Admin UI actions can trigger explicit API sync.

Examples:

- "Sync now" for one account.
- "Sync now" for one order.
- "Sync now" for one invoice.

The manual path:

1. Validates admin permissions.
2. Calls RO App API with `REMONLINE_API_KEY`.
3. Normalizes the API response.
4. Upserts local records.
5. Stores sync state such as `last_synced_at`, `sync_status`, and `sync_error` where relevant.

This path is allowed to fetch full data because an admin intentionally requested it.

## Client Sync

Client webhook events should be handled as payload-first events:

- `Client.Created`: create or attach a local user/account when the payload has enough identity data.
- `Client.Deleted`: mark the local RemOnline link as removed or handle deletion according to the current product rule.

If RemOnline later adds `Client.Updated`, it should use the same payload-first handler. It should not fetch by ID automatically.

Manual account sync remains available for broken or stale accounts.

## Order Sync

Order webhook events should be handled payload-first where possible:

- `Order.Created`
- `Order.Updated`
- `Order.Deleted`
- `Order.Status.Changed`

If the payload contains only partial order data, local fields that are absent from the payload should be left unchanged unless the event semantics clearly require clearing them.

Manual order sync can fetch full order details and services from RO App.

## Invoice Sync

Invoices should get their own local table and sync service.

Expected behavior:

- `Invoice.Created`: upsert from webhook payload only.
- `Invoice.Deleted`: mark deleted or remove the local invoice record, depending on the final product rule.
- Future `Invoice.Updated`: upsert from webhook payload only.
- Manual invoice "Sync now": fetch full invoice data from RO App and upsert.

The profile invoices section should read from local data only. It should not call RO App directly from the user-facing page.

## Error Handling

Webhook signature failure returns `401`.

Malformed JSON returns `400`.

Unsupported event names return success with "received but no action taken" so RemOnline does not retry indefinitely for events we intentionally ignore.

Payload normalization errors should be stored in local sync/error fields when the affected record can be identified. If the record cannot be identified, the route should log the failure and return a controlled error.

Manual sync errors should be visible in admin UI near the affected account/order/invoice.

## Testing

Tests should cover:

- The canonical route uses only `REMONLINE_WEBHOOK_SECRET`.
- Legacy webhook routes stay removed.
- Webhook handlers do not call RO App API clients automatically.
- Manual sync endpoints do call RO App API clients.
- Invoice payload normalization preserves empty values instead of replacing them with API-fetched data.

## Out Of Scope

- Scraping RemOnline UI.
- Browser automation for RemOnline.
- Automatic polling or scheduled reconciliation.
- Reintroducing multiple webhook secrets.
- Calling RO App API automatically after every webhook.
