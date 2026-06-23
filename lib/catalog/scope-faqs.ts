// Scope-aware, multilingual FAQ resolution for service+model pages.
//
// Cascade rule (agreed with owner): the MOST SPECIFIC scope that has any FAQs
// wins as a WHOLE list — model FAQs override series FAQs override the base
// service FAQs. We do NOT merge lists across scopes; a model that has its own
// FAQ set fully replaces the series/base set (so the owner stays in control of
// exactly what each page shows).
//
// Within the chosen list, each entry's text is resolved language-primary:
// the requested locale, then CS -> EN -> UK (same as scope-text.ts).

import { langChain } from "@/lib/catalog/scope-text"

export type FaqTranslation = {
  locale: string
  question?: string | null
  answer?: string | null
}

export type ScopeFaqEntry = {
  position?: number | null
  translations: FaqTranslation[]
}

export type ResolvedFaq = {
  question: string
  answer: string
}

function nonEmpty(v: string | null | undefined): string | null {
  return v && v.trim() !== "" ? v : null
}

// Resolve a single FAQ entry's text for the locale (language-primary fallback).
function resolveEntry(entry: ScopeFaqEntry, locale: string): ResolvedFaq | null {
  for (const lang of langChain(locale)) {
    const tr = entry.translations.find((t) => t.locale === lang)
    const q = nonEmpty(tr?.question)
    const a = nonEmpty(tr?.answer)
    if (q && a) return { question: q, answer: a }
  }
  return null
}

// Build the resolved list for one scope (sorted by position).
function resolveList(entries: ScopeFaqEntry[], locale: string): ResolvedFaq[] {
  return [...entries]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((e) => resolveEntry(e, locale))
    .filter((e): e is ResolvedFaq => e !== null)
}

// `scopes` is ordered most-specific-first (e.g. [model, series, base]).
// Returns the first scope's resolved list that is non-empty.
export function resolveScopedFaqs(locale: string, scopes: ScopeFaqEntry[][]): ResolvedFaq[] {
  for (const scope of scopes) {
    if (!scope || scope.length === 0) continue
    const list = resolveList(scope, locale)
    if (list.length > 0) return list
  }
  return []
}
