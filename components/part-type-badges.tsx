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
      {configs.map((config, index) => {
        console.log("[v0] Badge config:", config)
        return (
          <span
            key={`${config.variant}-${index}`}
            className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold ${config.bgClass} ${config.textClass} ${className}`}
            data-testid={`part-type-badge-${config.variant}`}
            style={{ backgroundColor: getBackgroundColor(config.bgClass) }}
          >
            {config.label}
          </span>
        )
      })}
    </div>
  )
}

function getBackgroundColor(bgClass: string): string {
  const colorMap: Record<string, string> = {
    "bg-yellow-400": "#facc15",
    "bg-red-500": "#ef4444",
    "bg-green-500": "#22c55e",
    "bg-orange-500": "#f97316",
    "bg-blue-500": "#3b82f6",
    "bg-gray-500": "#6b7280",
    "bg-gray-300": "#d1d5db",
  }
  return colorMap[bgClass] || "#ffffff"
}
