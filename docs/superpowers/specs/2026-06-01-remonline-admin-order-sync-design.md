# RemOnline Admin Order Sync Design

## Goal

Add an admin-only recovery path for RemOnline order synchronization. Webhooks should remain lightweight and reliable, while admins get a controlled way to inspect failed or ignored order events and manually sync the affected order from RemOnline.

## Current Context

The canonical RemOnline webhook endpoint is `/api/webhooks/remonline`. It verifies `X-Signature` with `REMONLINE_WEBHOOK_SECRET` before routing events. After the recent webhook hardening, signed events that cannot be applied locally can return HTTP 200 with `ignored: true` so RO App does not disable the webhook.

Order webhook processing is payload-first. `Order.Created` and `Order.Updated` use webhook payload fields only. `Order.Status.Changed` updates an existing local order, but it does not create a missing local order. Manual API reads are acceptable only from admin-triggered sync actions.

## Product Rule

Users must not be able to trigger RemOnline order sync from their profile. The profile should continue to read only local, already-synchronized order data. RemOnline recovery and reconciliation are admin operations.

## Recommended Architecture

Create a small RemOnline sync issue inbox for order-related webhook events that cannot be applied locally.

When a signed webhook is valid but cannot be applied because local data is missing or insufficient, the handler should acknowledge the webhook and record an issue. Examples:

- `Order.Created` arrives without enough client linkage to create a local order.
- `Order.Status.Changed` arrives for an order that is not in `user_repair_orders`.
- `Order.Deleted` arrives for a missing local order.
- A future order event arrives with a valid order id but no handler-specific local target.

The issue record should store enough context for admin recovery:

- RemOnline event id.
- `event_name`.
- RemOnline order id when available.
- RemOnline client id when available.
- Issue status such as `open`, `resolved`, or `ignored`.
- Failure reason.
- Raw signed payload.
- Timestamps for first seen, last seen, and resolution.

## Admin Manual Sync

Add an admin-only endpoint for one order:

`POST /api/admin/remonline/orders/[id]/sync`

The endpoint should:

1. Require an admin session.
2. Validate that `[id]` is a positive integer RemOnline order id.
3. Fetch full order details from RemOnline API.
4. Fetch order items from RemOnline API.
5. Resolve the local user by RemOnline client id.
6. Upsert `user_repair_orders`.
7. Replace or upsert `user_repair_order_services`.
8. Mark matching open sync issues as resolved when the local sync succeeds.

If the local user cannot be resolved, the endpoint should return a controlled failure and leave the issue open with a clear reason such as `client_not_linked`.

## Admin UI

Add admin visibility for order sync issues. The first version can be simple and utilitarian:

- A list of open RemOnline order sync issues.
- Columns for event, RemOnline order id, client id, reason, last seen, attempts.
- A `Sync order` action for rows with a RemOnline order id.
- A way to mark an issue ignored when it is known not to matter.

This should live in admin-only surfaces. It should not appear in the user profile.

## Error Handling

Invalid webhook signatures still return `401`.

Malformed JSON still returns `400`.

Signed but locally unapplied webhook events return `200` and record an issue where possible.

Manual sync API failures return a non-2xx status to the admin caller, because this is an explicit admin action rather than a RemOnline webhook delivery.

## Data Flow

Webhook path:

1. RO App sends signed event.
2. App verifies signature.
3. App tries payload-first local update.
4. If local update succeeds, no issue is created.
5. If local update cannot apply because data is missing, app stores or updates a sync issue and returns `200`.

Manual admin path:

1. Admin clicks `Sync order`.
2. App calls RemOnline API under the existing 3 requests/second limiter.
3. App normalizes order and items into local tables.
4. App marks related sync issue resolved.
5. User profile later reads the local order normally.

## Out Of Scope

- User-facing sync buttons.
- Automatic API fetch from webhook handlers.
- Scheduled polling or background reconciliation.
- Full redesign of the order profile UI.
- Invoice sync changes beyond linking order-related issue patterns where useful.

## Testing

Tests should prove these boundaries:

- Webhook handlers can record an issue without calling RemOnline API.
- Admin manual order sync is the only new order path that fetches full order data and items.
- Admin sync endpoint rejects non-admin sessions.
- User profile order endpoints do not call RemOnline API.
- A missing local order on `Order.Status.Changed` is acknowledged and recorded, not returned as a webhook-breaking error.
