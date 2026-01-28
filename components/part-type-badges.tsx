"use client"

import { getPartTypeConfigsFromString, parsePartTypes } from "@/lib/part-type-badge-utils"
import { useTranslations } from "next-intl"

interface PartTypeBadgesProps {
  partTypeString?: string | null
  className?: string
  containerClassName?: string
}

/**
 * Компонент для відображення бейджів типів деталей
 * Розбирає рядок part_type на окремі бейджі з унікальними фонами
 */
export function PartTypeBadges({ partTypeString, className = "", containerClassName = "" }: PartTypeBadgesProps) {
  const t = useTranslations("Common")
  const configs = getPartTypeConfigsFromString(partTypeString)

  if (configs.length === 0) return null

  // Отримуємо переклади для типів, якщо вони доступні
  const getTranslatedLabel = (partType: string): string => {
    const key = `partType.${partType.toLowerCase()}`
    try {
      // Спробуємо отримати переклад
      return t(key)
    } catch {
      // Якщо немає перекладу, використовуємо конфіг
      return configs.find((c) => c.label.toLowerCase() === partType.toLowerCase())?.label || partType
    }
  }

  return (
    <div
      className={`flex flex-wrap gap-2 ${containerClassName}`}
      data-testid="part-type-badges"
    >
      {configs.map((config, index) => (
        <span
          key={`${config.variant}-${index}`}
          className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold transition-opacity hover:opacity-80 ${config.bgClass} ${config.textClass} ${className}`}
          data-testid={`part-type-badge-${config.variant}`}
        >
          {getTranslatedLabel(config.variant)}
        </span>
      ))}
    </div>
  )
}
