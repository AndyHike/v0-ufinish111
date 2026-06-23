// Scope- and language-aware resolution of service text overrides.
//
// Cascade rules (agreed with product):
//  - Language is PRIMARY: keep the requested locale across every scope level
//    before switching to another language. A /uk/ page never shows Czech text
//    if Ukrainian exists at any scope (correct hreflang/UX).
//  - Within a single language, the MOST SPECIFIC scope wins:
//    model -> series -> brand -> base service (services_translations).
//  - Language fallback after the requested locale: CS -> EN -> UK
//    (cs is the site default and the owner's primary market).
//
// The base ("service") level lives in services_translations; the model/series/
// brand overrides live in service_scope_translations.

export type ScopeField = "detailed_description" | "what_included" | "benefits"

export type ScopeRow = {
  service_id: string
  scope_type: "model" | "series" | "brand"
  scope_id: string
  locale: string
  detailed_description?: string | null
  what_included?: string | null
  benefits?: string | null
}

export type BaseTranslation = {
  locale: string
  detailed_description?: string | null
  what_included?: string | null
  benefits?: string | null
}

export type ScopeIds = {
  modelId?: string | null
  seriesId?: string | null
  brandId?: string | null
}

// After the requested locale, fall back: CS -> EN -> UK (site default first).
const FALLBACK_ORDER = ["cs", "en", "uk"]

export function langChain(locale: string): string[] {
  const chain = [locale, ...FALLBACK_ORDER]
  return chain.filter((l, i) => chain.indexOf(l) === i)
}

function nonEmpty(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v : null
}

export function resolveScopedField(
  field: ScopeField,
  serviceId: string,
  locale: string,
  scopeRows: ScopeRow[],
  baseTranslations: BaseTranslation[],
  scopeIds: ScopeIds,
): string | null {
  const scopeOrder: Array<["model" | "series" | "brand", string | null | undefined]> = [
    ["model", scopeIds.modelId],
    ["series", scopeIds.seriesId],
    ["brand", scopeIds.brandId],
  ]

  for (const lang of langChain(locale)) {
    // most-specific scope overrides first
    for (const [type, id] of scopeOrder) {
      if (!id) continue
      const row = scopeRows.find(
        (r) =>
          r.service_id === serviceId &&
          r.scope_type === type &&
          r.scope_id === id &&
          r.locale === lang,
      )
      const val = nonEmpty(row?.[field])
      if (val) return val
    }
    // base service translation (least specific)
    const base = baseTranslations.find((t) => t.locale === lang)
    const baseVal = nonEmpty(base?.[field])
    if (baseVal) return baseVal
  }

  return null
}
