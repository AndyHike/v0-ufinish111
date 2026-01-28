/**
 * Утиліта для обробки та відображення part_type бейджів
 * Визначає кольорові схеми для різних типів деталей послуг
 */

export type PartTypeVariant = "original" | "oled" | "ips" | "lcd" | "premium" | "refurbished" | "default"

export interface PartTypeConfig {
  variant: PartTypeVariant
  bgClass: string
  textClass: string
  label: string
}

/**
 * Конфіг кольорових схем для різних типів деталей
 * Кожен тип має унікальний фон і текстовий колір для контрасту
 */
export const PART_TYPE_CONFIGS: Record<string, PartTypeConfig> = {
  original: {
    variant: "original",
    bgClass: "bg-yellow-400",
    textClass: "text-gray-900 font-bold",
    label: "Original",
  },
  oled: {
    variant: "oled",
    bgClass: "bg-red-500",
    textClass: "text-white font-bold",
    label: "OLED",
  },
  ips: {
    variant: "ips",
    bgClass: "bg-green-500",
    textClass: "text-white font-bold",
    label: "IPS",
  },
  lcd: {
    variant: "lcd",
    bgClass: "bg-orange-500",
    textClass: "text-white font-bold",
    label: "LCD",
  },
  premium: {
    variant: "premium",
    bgClass: "bg-blue-500",
    textClass: "text-white font-bold",
    label: "Premium",
  },
  refurbished: {
    variant: "refurbished",
    bgClass: "bg-gray-500",
    textClass: "text-white font-bold",
    label: "Refurbished",
  },
  default: {
    variant: "default",
    bgClass: "bg-gray-300",
    textClass: "text-gray-900 font-semibold",
    label: "Part",
  },
}

/**
 * Розбирає рядок part_type на масив окремих типів
 * @param partTypeString - рядок типів розділених комами (наприклад "original,oled")
 * @returns масив окремих типів
 */
export function parsePartTypes(partTypeString: string | null | undefined): string[] {
  if (!partTypeString) return []

  return partTypeString
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Отримує конфіг для конкретного типу деталі
 * @param partType - тип деталі
 * @returns конфіг кольорів та стилів
 */
export function getPartTypeConfig(partType: string): PartTypeConfig {
  const normalized = partType.toLowerCase().trim()
  
  // Перевіримо точне збіг
  if (PART_TYPE_CONFIGS[normalized]) {
    return PART_TYPE_CONFIGS[normalized]
  }
  
  // Перевіримо чи містить слово з конфіга
  for (const key of Object.keys(PART_TYPE_CONFIGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return PART_TYPE_CONFIGS[key]
    }
  }
  
  // Повернемо default конфіг
  return PART_TYPE_CONFIGS.default || {
    variant: "default",
    bgClass: "bg-gray-300",
    textClass: "text-gray-900 font-semibold",
    label: partType,
  }
}

/**
 * Отримує масив конфігів для всіх типів у рядку
 * @param partTypeString - рядок типів (наприклад "original,oled")
 * @returns масив конфігів
 */
export function getPartTypeConfigsFromString(partTypeString: string | null | undefined): PartTypeConfig[] {
  const types = parsePartTypes(partTypeString)
  return types.map((type) => getPartTypeConfig(type))
}

/**
 * Перевіряє, чи рядок містить конкретний тип
 * @param partTypeString - рядок типів
 * @param searchType - тип для пошуку
 * @returns true якщо тип знайдений
 */
export function hasPartType(partTypeString: string | null | undefined, searchType: string): boolean {
  const types = parsePartTypes(partTypeString)
  return types.includes(searchType.toLowerCase())
}

/**
 * Отримує відображуваний текст для типу
 * (може бути локалізований у компоненті з useTranslations)
 * @param partType - тип деталі
 * @returns текст для відображення
 */
export function getPartTypeDisplayLabel(partType: string): string {
  const config = getPartTypeConfig(partType)
  return config.label
}
