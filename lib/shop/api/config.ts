import "server-only"

/**
 * Server-to-server admin API configuration (README "Server-to-server" mode).
 *
 * Put these in `.env.local` (never commit real values):
 *   SHOP_ADMIN_API_URL=https://admin.example.com
 *   SHOP_ADMIN_MASTER_KEY=sk_or_system_master_key
 *   SHOP_ADMIN_DOMAIN=shop.devicehelp.cz
 *
 * The master key is read only on the server and is never exposed to the
 * browser. When the URL or key is missing, the shop transparently falls back
 * to mock data so local design work keeps running.
 */
export const shopAdminApiUrl = process.env.SHOP_ADMIN_API_URL?.replace(/\/$/, "") ?? ""
export const shopAdminMasterKey = process.env.SHOP_ADMIN_MASTER_KEY ?? ""
export const shopAdminDomain = process.env.SHOP_ADMIN_DOMAIN ?? ""

export function isShopApiEnabled(): boolean {
  return shopAdminApiUrl.length > 0 && shopAdminMasterKey.length > 0
}
