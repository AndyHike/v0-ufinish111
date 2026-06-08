# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build (output: standalone)
npm run lint         # next lint
npx tsc --noEmit     # Type-check — see gotcha below

# Tests (node:test, no runner config — run files directly)
npm run test:shop                          # all tests/shop-*.test.mjs
npm run test:b2b-routing                   # one grouped script
node --test tests/shop-catalog.test.mjs    # a single test file
```

> **Gotcha:** `next.config.mjs` sets `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds`, so `next build` will **not** fail on type or lint errors. Run `npx tsc --noEmit` explicitly to catch type errors before committing.

### How the tests work

Tests are `.mjs` files using `node:test`. They do **not** boot the Next app. Instead they transpile the relevant `.ts` modules in-memory with `ts.transpileModule` (types are stripped — **no type-checking happens in tests**) and assert on the runtime behavior of pure modules (`lib/shop/catalog.ts`, `lib/*-routing.ts`, `lib/shop/seo.ts`, …). Some tests (`shop-ui-source.test.mjs`) assert against component **source strings** rather than rendered output. Keep this in mind: a test passing does not guarantee the code type-checks.

## Architecture

This is a **single Next.js 15 App Router codebase that serves three distinct sites** by hostname, plus a customer auth/profile area. Stack: TypeScript, `next-intl` (locales `cs` / `uk` / `en`, default `cs`), Tailwind + Radix/shadcn UI. Path alias `@/*` → repo root.

### Host-based multi-site routing (`middleware.ts`)

`middleware.ts` is the control plane. For every request it, in order:

1. Forces HTTPS (prod) and strips `www.` (301).
2. Detects the host and delegates to `lib/b2b-routing.ts` then `lib/shop-routing.ts`:
   - **Redirect** (308) — canonicalize a subdomain path to its default-locale form.
   - **Rewrite** — map the public subdomain path to the internal app folder.
3. Prepends the locale to locale-less paths (301, sets `NEXT_LOCALE` cookie).
4. Gates `/profile` and `/admin` on a `session_id` cookie; honors `NEXT_PUBLIC_MAINTENANCE_MODE`.

The three sites and their internal folders:

| Public host | Internal route folder | Routing lib |
| :--- | :--- | :--- |
| `devicehelp.cz` (main — phone-repair services) | `app/[locale]/…` | — |
| `b2b.devicehelp.cz` | `app/b2b/[locale]/…` | `lib/b2b-routing.ts` |
| `shop.devicehelp.cz` | `app/shop/[locale]/…` | `lib/shop-routing.ts` |

**Key nuance:** users see `shop.devicehelp.cz/cs/category/…`, but the middleware rewrites that to the internal path `/shop/cs/category/…`. The literal `/shop/*` and `/b2b/*` paths on the main host are treated as internal-only and skipped by the middleware matcher. Shop-host API routes (`shop.devicehelp.cz/api/...`) are served same-origin without locale rewriting.

### Data backends

- **Main site & B2B:** Supabase (`lib/supabase.ts`, service-role on server) plus **Remonline** POS/CRM (`lib/api/remonline.ts`, `api.roapp.io`) for orders, invoices, and account sync. Much of the Remonline work is payload-first webhook sync — see the many `tests/remonline-*.test.mjs` and `docs/superpowers/`.
- **Shop:** consumes a **separate external admin Public API** (not in this repo). The full contract lives in `api_docs/PUBLIC_API_DOCS.md` and `docs/external-frontends/`. **Read these before touching anything under `lib/shop/`.**
- **Images:** Supabase Storage and Cloudflare R2 (shop product/category images); allowed remote patterns are in `next.config.mjs`.

### Shop storefront data layer (`lib/shop/`)

The storefront is a thin renderer over the external API. The flow is:

```
external Public API  →  api/client.ts (shopApiFetch: auth, ?domain, unwrap {success,data}, cache tags)
                     →  api/mappers.ts (loose Api* shapes → internal Shop* types in types.ts)
                     →  data.ts (server-only fetchers: home / category / product / search)
                     →  catalog.ts (pure transforms: facets, filtering, sort, price, spec rows)
                     →  app/shop/[locale]/… pages + components/shop/*
```

- `api/config.ts` — picks the auth mode by **key prefix**: `sk_`/`pk_` → header `x-public-api-key` (store-scoped); anything else → `Authorization: Bearer` + `?domain=` (system master key). When `SHOP_ADMIN_API_URL` + `SHOP_ADMIN_API_KEY` are unset, or `SHOP_FORCE_MOCK=1`, the shop falls back to `mock-data.ts`. Copy `.env.shop.example` to start.
- `data.ts` returns empty/`null` on a missing or failing live API (it does **not** serve mock data in the live path — `mock-data.ts` is for local dev and tests via `catalog.ts`'s `getMock*` helpers).
- `api/tags.ts` builds `site:{storeId}:…` cache tags. The admin pushes on-demand revalidation to `app/api/shop/revalidate/route.ts` (verified by `REVALIDATE_SECRET`); same-origin typeahead is `app/api/shop/search/route.ts`.
- `lib/shop/*` and `api/client.ts` are `server-only`.

When the external API contract changes (e.g. attributes/filters), the adaptation points are, in order: `types.ts` → `api/mappers.ts` → `data.ts`/`catalog.ts` → `components/shop/*`. The category filter UI uses a URL scheme of `attr_<attributeSlug>=<optionSlug>`.

## Conventions

- Supported locales are hardcoded as string arrays in several places (`middleware.ts`, `i18n.ts`, `lib/shop-routing.ts`); keep them in sync when adding a locale. UI copy is typically inlined as per-locale `const COPY = { cs, uk, en }` objects in components, in addition to `messages/*.json` for `next-intl`.
- There are both `package-lock.json` and `pnpm-lock.yaml`; the npm scripts above are the source of truth. This repo also auto-syncs from v0.dev (see `README.md`).
