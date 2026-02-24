/**
 * Convert app locale code to IETF BCP 47 format required by OpenGraph
 * OpenGraph requires e.g. "cs_CZ" not "cs"
 */
export function toOGLocale(locale: string): string {
    const map: Record<string, string> = {
        cs: "cs_CZ",
        en: "en_US",
        uk: "uk_UA",
    }
    return map[locale] ?? locale
}
