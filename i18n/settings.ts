/**
 * Глобальні мовні налаштування застосунку.
 * Додавайте сюди нові коди мов, якщо розширюватимете локалізацію.
 */
export const languages = ["cs", "en", "uk"] as const
export type SupportedLocale = (typeof languages)[number]

/**
 * Мова за замовчуванням, якщо не вдалося визначити іншу.
 */
export const defaultLocale: SupportedLocale = "cs"
