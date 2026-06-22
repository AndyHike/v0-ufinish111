import "server-only"

import { SHOP_ENABLED } from "@/lib/shop-routing"

/**
 * Admin Public API configuration. Two auth styles are supported automatically
 * based on the key prefix:
 *   - Secret/Public key (`sk_...` / `pk_...`)  -> header `x-public-api-key`
 *   - System master key (anything else)        -> header `Authorization: Bearer`
 *
 * Put these in `.env` (never commit real values):
 *   SHOP_ADMIN_API_URL=https://adminpanel.mobil-brevnov.cz
 *   SHOP_ADMIN_API_KEY=sk_v1_...            # secret key (server-only) or system master key
 *   SHOP_ADMIN_DOMAIN=mobil-brevnov.cz      # optional; only needed for master-key mode
 *
 * The key is read only on the server and never exposed to the browser. When the
 * URL or key is missing, the shop transparently falls back to mock data so local
 * design work keeps running. `SHOP_ADMIN_MASTER_KEY` is still accepted as an
 * alias for backwards compatibility.
 */
export const shopAdminApiUrl = process.env.SHOP_ADMIN_API_URL?.replace(/\/$/, "") ?? ""
export const shopAdminApiKey = process.env.SHOP_ADMIN_API_KEY ?? process.env.SHOP_ADMIN_MASTER_KEY ?? ""
export const shopAdminDomain = process.env.SHOP_ADMIN_DOMAIN ?? ""

/**
 * Store id used to build `site:{storeId}:...` cache tags that match the admin's
 * revalidation webhook. Some deployments omit `storeId` from API responses, so
 * set it explicitly here (copy it from the admin → Developers, or the webhook's
 * `event.siteId`). When empty, reads are left untagged and on-demand
 * revalidation falls back to path-based invalidation.
 */
export const shopAdminStoreId = process.env.SHOP_ADMIN_STORE_ID ?? ""

/** Secret/public keys authenticate via `x-public-api-key`; master keys via Bearer. */
export function usesPublicApiKeyHeader(): boolean {
  return shopAdminApiKey.startsWith("sk_") || shopAdminApiKey.startsWith("pk_")
}

/** Set SHOP_FORCE_MOCK=1 to keep using mock data even when API env is present. */
const shopForceMock = process.env.SHOP_FORCE_MOCK === "1" || process.env.SHOP_FORCE_MOCK === "true"

export function isShopApiEnabled(): boolean {
  // The kill switch wins: with the storefront off, the data layer makes no
  // admin-API calls at all, so the build can never fail on `store_suspended`.
  return SHOP_ENABLED && !shopForceMock && shopAdminApiUrl.length > 0 && shopAdminApiKey.length > 0
}
