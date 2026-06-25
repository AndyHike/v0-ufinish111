import "server-only"
import { createClient } from "@/utils/supabase/client"

export type LegalDocument = {
  id: string
  slug: string
  title_cs: string
  title_uk: string
  title_en: string
  content: string
  is_active: boolean
  required_at_registration: boolean
  sort_order: number
}

const COLUMNS =
  "id, slug, title_cs, title_uk, title_en, content, is_active, required_at_registration, sort_order"

// Slugs that keep their own dedicated route for SEO/back-compat. Everything
// else is served by the generic /[locale]/legal/[slug] route.
const RESERVED_PATHS: Record<string, string> = {
  privacy: "privacy",
  terms: "terms",
}

/** True for slugs that keep a dedicated route instead of /legal/[slug]. */
export function isReservedLegalSlug(slug: string): boolean {
  return slug in RESERVED_PATHS
}

/** Public path for a document, locale-prefixed. */
export function legalDocumentPath(locale: string, slug: string): string {
  const reserved = RESERVED_PATHS[slug]
  return reserved ? `/${locale}/${reserved}` : `/${locale}/legal/${slug}`
}

/** Title in the requested locale, falling back to Czech. */
export function localizedTitle(doc: Pick<LegalDocument, "title_cs" | "title_uk" | "title_en">, locale: string): string {
  const byLocale: Record<string, string> = {
    cs: doc.title_cs,
    uk: doc.title_uk,
    en: doc.title_en,
  }
  return byLocale[locale]?.trim() || doc.title_cs
}

/** Single active document by slug, or null if missing/inactive. */
export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("legal_documents")
      .select(COLUMNS)
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error) {
      if (error.code !== "PGRST116") {
        console.error(`Error fetching legal document "${slug}":`, error)
      }
      return null
    }

    return data as LegalDocument
  } catch (error) {
    console.error(`Unexpected error fetching legal document "${slug}":`, error)
    return null
  }
}

/** All active documents, ordered for the footer. */
export async function getActiveLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("legal_documents")
      .select(COLUMNS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching active legal documents:", error)
      return []
    }

    return (data as LegalDocument[]) ?? []
  } catch (error) {
    console.error("Unexpected error fetching active legal documents:", error)
    return []
  }
}

/** Active documents that must be accepted during registration. */
export async function getRequiredRegistrationDocuments(): Promise<LegalDocument[]> {
  const docs = await getActiveLegalDocuments()
  return docs.filter((doc) => doc.required_at_registration)
}
