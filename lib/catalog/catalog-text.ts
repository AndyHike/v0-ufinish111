// Scope- and language-aware resolution of catalog PAGE descriptions
// (series / model / brand pages), independent of services.
//
// Same philosophy as lib/catalog/scope-text.ts:
//  - Language is PRIMARY: keep the requested locale across every scope level
//    before switching language (a /uk/ page never shows Czech if Ukrainian
//    exists at any scope).
//  - Within a language, the MOST SPECIFIC scope wins. The caller passes the
//    scope order, e.g. a model page uses [model, series, brand]; a series page
//    uses [series, brand].
//  - Language fallback after the requested locale: CS -> EN -> UK.

import { langChain } from "@/lib/catalog/scope-text"

export type CatalogField = "description" | "body"

export type CatalogScopeType = "model" | "series" | "brand"

export type CatalogDescriptionRow = {
  scope_type: CatalogScopeType
  scope_id: string
  locale: string
  description?: string | null
  body?: string | null
}

export type CatalogScopeRef = {
  type: CatalogScopeType
  id: string | null | undefined
}

function nonEmpty(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v : null
}

// Resolve one field across the given scope order, language-primary.
export function resolveCatalogField(
  field: CatalogField,
  locale: string,
  rows: CatalogDescriptionRow[],
  scopeOrder: CatalogScopeRef[],
): string | null {
  for (const lang of langChain(locale)) {
    for (const scope of scopeOrder) {
      if (!scope.id) continue
      const row = rows.find(
        (r) => r.scope_type === scope.type && r.scope_id === scope.id && r.locale === lang,
      )
      const val = nonEmpty(row?.[field])
      if (val) return val
    }
  }
  return null
}
