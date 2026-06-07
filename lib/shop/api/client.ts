import "server-only"

import { isShopApiEnabled, shopAdminApiKey, shopAdminApiUrl, shopAdminDomain, usesPublicApiKeyHeader } from "./config"

export class ShopApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = "ShopApiError"
  }
}

type ShopApiFetchOptions = {
  /** Query params appended to the request (besides the always-present `domain`). */
  searchParams?: Record<string, string | number | undefined | null>
  /** ISR revalidation window in seconds. Defaults to 1 hour. */
  revalidate?: number
  /** Next.js cache tags for on-demand (webhook) revalidation. */
  tags?: string[]
}

/**
 * Low-level server-to-server fetch against the admin Public API.
 * Adds `Authorization: Bearer <masterKey>` and the required `?domain=` param,
 * unwraps the `{ success, data }` envelope, and throws `ShopApiError` on failure.
 */
export async function shopApiFetch<T>(path: string, options: ShopApiFetchOptions = {}): Promise<T> {
  if (!isShopApiEnabled()) {
    throw new ShopApiError("Shop admin API is not configured", 500, "NOT_CONFIGURED")
  }

  const usePublicKeyHeader = usesPublicApiKeyHeader()

  const url = new URL(`${shopAdminApiUrl}/api/public/v1/${path.replace(/^\//, "")}`)
  // Secret/public keys are store-scoped and don't need `domain`; the master-key
  // server-to-server mode does.
  if (shopAdminDomain && !usePublicKeyHeader) {
    url.searchParams.set("domain", shopAdminDomain)
  }
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value))
    }
  }

  const authHeader: Record<string, string> = usePublicKeyHeader
    ? { "x-public-api-key": shopAdminApiKey }
    : { Authorization: `Bearer ${shopAdminApiKey}` }

  const response = await fetch(url, {
    headers: {
      ...authHeader,
      Accept: "application/json",
    },
    next: { revalidate: options.revalidate ?? 3600, tags: options.tags },
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const body = (payload ?? {}) as { error?: string; code?: string }
    throw new ShopApiError(body.error ?? `Request failed: ${path}`, response.status, body.code)
  }

  const body = (payload ?? {}) as { success?: boolean; data?: T; error?: string; code?: string }
  if (body.success === false || body.data === undefined) {
    throw new ShopApiError(body.error ?? `Unexpected response: ${path}`, response.status, body.code)
  }

  return body.data
}
