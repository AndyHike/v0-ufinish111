export const fallbackLng = "cs"
export const languages = ["cs", "en", "uk"]
export const defaultNS = "common"

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}
