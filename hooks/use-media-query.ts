"use client"

import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    // Встановлюємо початковий стан
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    // Створюємо обробник для відстеження змін
    const listener = () => {
      setMatches(media.matches)
    }

    // Додаємо слухача
    media.addEventListener("change", listener)

    // Очищаємо слухача при розмонтуванні
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [matches, query])

  return matches
}
