import { transliterate } from 'transliteration'

/**
 * Генерує SEO-friendly slug з заголовку
 * Підтримує транслітерацію для український, а також стандартну нормалізацію
 * 
 * @param text - Заголовок для конвертації
 * @param locale - Мова (cs, uk, en)
 * @returns SEO-friendly slug
 * 
 * Приклади:
 * - generateSlug("Як вичистити конектор", "uk") => "yak-vychystyty-konektor"
 * - generateSlug("Jak vyčistit konektor", "cs") => "jak-vycistit-konektor"
 * - generateSlug("How to clean connector", "en") => "how-to-clean-connector"
 */
export function generateSlug(text: string, locale: string = "en"): string {
  if (!text) return ""

  let slug: string

  if (locale === "uk") {
    // Для української мови використовуємо транслітерацію
    slug = transliterate(text, { unknown: "-" })
  } else {
    // Для інших мов просто нормалізуємо
    slug = text.toLowerCase()
  }

  // Нормалізація:
  // 1. Замінюємо всі спеціальні символи і пробіли на "-"
  // 2. Видаляємо множественні "-"
  // 3. Видаляємо "-" на початку і кінці
  return slug
    .normalize("NFD") // Нормалізуємо діакритику
    .replace(/[\u0300-\u036f]/g, "") // Видаляємо діакритичні значки
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Видаляємо всі спеціальні символи крім пробілів і "-"
    .replace(/[\s_-]+/g, "-") // Замінюємо пробіли, підкреслення на "-"
    .replace(/^-+|-+$/g, "") // Видаляємо "-" на початку і кінці
}

/**
 * Перевіряє, чи slug валідний
 */
export function isValidSlug(slug: string): boolean {
  // Slug має містити тільки буквинии, цифри, дефіси і не бути порожнім
  return /^[a-z0-9-]{1,100}$/.test(slug)
}

/**
 * Нормалізує вручну введений slug
 * Замінює пробіли на дефіси
 */
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Замінюємо пробіли на дефіси
    .replace(/[^\w-]/g, "") // Видаляємо спеціальні символи
    .replace(/-+/g, "-") // Видаляємо множественні дефіси
    .replace(/^-+|-+$/g, "") // Видаляємо дефіси на початку і кінці
}

/**
 * Генерує час читання на основі контенту
 * Розраховує на базі 200 слів за хвилину
 */
export function generateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content
    .replace(/<[^>]*>/g, "") // Видаляємо HTML теги
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

/**
 * Генерує мета-описання з контенту
 * Беремо перші 155 символів (Google стандарт)
 */
export function generateMetaDescription(content: string): string {
  const text = content
    .replace(/<[^>]*>/g, "") // Видаляємо HTML теги
    .replace(/\s+/g, " ") // Нормалізуємо пробіли
    .trim()

  return text.substring(0, 155) + (text.length > 155 ? "..." : "")
}
