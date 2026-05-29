# RemOnline Account Sync Design

Status: approved direction on 2026-05-29.

## Scope

This is the first RemOnline integration phase. It covers account/contact synchronization only.

Included:
- Create/update local users as either end customers or B2B company accounts.
- Create the matching RO App contact as either a Person or an Organization.
- Show RemOnline synchronization state in the admin users table.
- Allow an admin to retry synchronization for one problematic account.
- Verify RemOnline webhook signatures before processing client events.

Excluded from this phase:
- Orders and order statuses.
- Profile order-history redesign.
- Invoices, invoice documents, and payments.
- Booking from the site into RemOnline.

## RO App API Facts

The current public API base URL is `https://api.roapp.io/v2`.

Requests use Bearer token authentication:

```text
Authorization: Bearer YOUR_API_KEY
```

The API allows up to 3 requests per second. When the limit is exceeded, RO App returns HTTP `429 Too Many Requests`.

Contacts are split into:
- `/contacts/people` for end customers.
- `/contacts/organizations` for companies.

For organizations:
- `business_registration_number` maps to Czech ICO.
- `tax_identification_number` maps to Czech DIC.

For people:
- `tax_identification_number` exists, but normal end customers do not need ICO/DIC.

Webhook requests include `X-Signature`, a SHA-256 hash generated from webhook id + webhook secret.

Sources:
- https://roapp.readme.io/reference/getting-started-with-api.md
- https://roapp.readme.io/reference/create-person.md
- https://roapp.readme.io/reference/create-organization.md
- https://roapp.readme.io/reference/webhooks.md

## Contact Mapping

Local end customer:
- `users.is_b2b = false`
- Create or update one RO App Person.
- Store the RO App person id in `users.remonline_id`.
- Store contact type as `person`.

Local B2B account:
- `users.is_b2b = true`
- Create or update one RO App Organization.
- Do not create a separate Person or link a Person to the Organization in this phase.
- Store the RO App organization id in `users.remonline_id`.
- Store contact type as `organization`.
- Send `company_name` as `name`.
- Send `ico` as `business_registration_number`.
- Send `dic` as `tax_identification_number`.

Phone payloads should use RO App's `phones` array with a single primary phone when a local phone exists.

## Sync State

Local user creation must not fail only because RO App synchronization fails. The local account should be created first, then synchronization should be attempted.

Add sync state fields to local `users`:
- `remonline_contact_type`: `person`, `organization`, or null.
- `remonline_sync_status`: `pending`, `synced`, or `error`.
- `remonline_sync_error`: nullable text with a safe admin-facing error summary.
- `remonline_synced_at`: nullable timestamp.
- `remonline_sync_attempts`: integer count.

Expected state transitions:
- New local user before RO App attempt: `pending`.
- Successful RO App create/update: `synced`, clear error, set `remonline_id`, set contact type, set synced timestamp.
- Failed RO App create/update: `error`, keep local user, store safe error summary, increment attempts.
- Manual retry: move to `pending` while running, then `synced` or `error`.

## Admin UX

In the admin users list, show a compact RemOnline status indicator near each account:
- Synced: green badge with contact type and RO App id.
- Pending: neutral/amber badge.
- Error: red badge with short error tooltip or text.
- Not attempted/no data: neutral badge.

For rows with `error` or missing `remonline_id`, expose a "Sync RemOnline" action in the user action menu. The action calls a single-user admin retry endpoint and refreshes the table.

The admin endpoint should be server-side protected with the existing admin session check and should never accept arbitrary RemOnline payload data from the client. It should read the current user/profile rows from Supabase, build the RO App payload on the server, and run the sync.

## API Client Design

Replace account synchronization use of the legacy `/clients` API with RO App v2 contact endpoints.

The client should:
- Prefer `REMONLINE_API_KEY`, fallback to `REMONLINE_API_TOKEN` for compatibility with the current environment.
- Use base URL `https://api.roapp.io/v2` for new account/contact calls.
- Enforce a process-local 3 requests/second limiter.
- On `429`, wait and retry once or twice with a small backoff.
- Return structured results with `success`, `id`, `contactType`, `status`, and safe error message.

The implementation should keep order/service methods isolated enough that account changes do not accidentally rewrite the later order-status phase.

## Webhook Security

All RemOnline webhook routes that process client/account events must verify `X-Signature` before mutating the database.

Verification rule:
- Read raw request body once.
- Parse JSON after signature verification inputs are available.
- Require payload `id`.
- Compute `sha256(payload.id + secret)`.
- Compare with `X-Signature` using constant-time comparison.

If the secret is missing in production, return a server error and do not process the webhook. In development, missing secret may be logged and rejected unless explicitly bypassed by a development-only flag.

## Testing

Tests should cover:
- Mapping a normal user to a Person payload.
- Mapping a B2B user to an Organization payload with ICO/DIC.
- Marking local sync as `error` when RO App create fails.
- Marking local sync as `synced` and storing `remonline_id` when RO App create succeeds.
- Manual retry endpoint requires admin access and syncs only the requested user.
- Webhook signature verification accepts valid signatures and rejects invalid/missing signatures.
- Rate limiter behavior does not schedule more than 3 immediate requests per second, using fake timers or an injected clock where practical.

Manual live RO App tests must avoid creating throwaway CRM data unless explicitly approved.
