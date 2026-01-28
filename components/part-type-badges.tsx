"use client"

import { getPartTypeConfigsFromString } from "@/lib/part-type-badge-utils"

interface PartTypeBadgesProps {
  partTypeString?: string | null
  className?: string
  containerClassName?: string
}

/**
 * Компонент для відображення типів деталей
 * Розбирає рядок part_type на окремі елементи
 * Показує просто текст з кольором, без фону
 */
export function PartTypeBadges({ partTypeString, className = "", containerClassName = "" }: PartTypeBadgesProps) {
  const configs = getPartTypeConfigsFromString(partTypeString)

  if (configs.length === 0) return null

  return (
    <div
      className={`flex flex-wrap gap-2 ${containerClassName}`}
      data-testid="part-type-badges"
    >
      {configs.map((config, index) => (
        <span
          key={`${config.variant}-${index}`}
          className={`text-xs font-semibold ${config.textClass} ${className}`}
          data-testid={`part-type-badge-${config.variant}`}
        >
          {config.label}
        </span>
      ))}
    </div>
  )
}
