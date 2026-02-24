/**
 * Shared site URL config — reads NEXT_PUBLIC_SITE_URL at runtime.
 *
 * On production set: NEXT_PUBLIC_SITE_URL=https://devicehelp.cz
 * On staging set:    NEXT_PUBLIC_SITE_URL=https://test2.mobil-brevnov.cz
 *
 * This makes canonical, hreflang, and OG URLs correct on ANY domain,
 * fixing the "No self-referencing hreflang" error on staging.
 */
export const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://devicehelp.cz"
