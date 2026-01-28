"use client"

import { getPartTypeConfigsFromString } from "@/lib/part-type-badge-utils"

interface PartTypeBadgesProps {
  partTypeString?: string | null
  className?: string
  containerClassName?: string
}

/**
 * Компонент для відображення бейджів типів деталей
 * Розбирає рядок part_type на окремі бейджі з унікальними фонами
 * Значення беруться прямо з БД без переводів
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
          className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold transition-opacity hover:opacity-80 ${config.bgClass} ${config.textClass} ${className}`}
          data-testid={`part-type-badge-${config.variant}`}
        >
          {config.label}
        </span>
      ))}
    </div>
  )
}
