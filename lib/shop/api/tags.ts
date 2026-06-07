/**
 * Cache-tag builders matching the admin revalidation contract (revalidation.md
 * §4). Every tag is prefixed with `site:{storeId}:`. Attaching these to
 * `fetch(..., { next: { tags } })` lets the admin webhook invalidate exactly the
 * right reads via `revalidateTag`.
 *
 * `collectionKey` is the slug of a category; for an item it is the slug of its
 * primary category.
 */

export function siteTag(storeId: string): string {
  return `site:${storeId}`
}

export function viewHomeTag(storeId: string): string {
  return `site:${storeId}:view:home`
}

export function settingsTag(storeId: string): string {
  return `site:${storeId}:settings`
}

export function filtersTag(storeId: string): string {
  return `site:${storeId}:filters`
}

export function availabilityTag(storeId: string): string {
  return `site:${storeId}:availability`
}

export function collectionTag(storeId: string, key: string): string {
  return `site:${storeId}:collection:${key}`
}

export function viewTag(storeId: string, key: string): string {
  return `site:${storeId}:view:${key}`
}

export function listViewTag(storeId: string, key: string): string {
  return `site:${storeId}:view:list:${key}`
}

export function itemTag(storeId: string, key: string, slug: string): string {
  return `site:${storeId}:item:${key}:${slug}`
}

export function detailViewTag(storeId: string, key: string, slug: string): string {
  return `site:${storeId}:view:detail:${key}:${slug}`
}
