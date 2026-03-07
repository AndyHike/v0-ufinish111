"use client"

import { useEffect, useRef, useState } from "react"
import { formatCurrency } from "@/lib/format-currency"

interface AnimatedPriceProps {
    value: number
    initialValue?: number
    className?: string
    duration?: number // ms
}

/**
 * AnimatedPrice — displays a number that "counts" from the previously
 * rendered value to the new one using requestAnimationFrame.
 *
 * On first mount it renders immediately (no animation).
 * On subsequent value changes it animates the transition.
 */
export function AnimatedPrice({ value, initialValue, className = "", duration = 400 }: AnimatedPriceProps) {
    const defaultInitial = initialValue !== undefined ? initialValue : value
    const [displayValue, setDisplayValue] = useState(defaultInitial)
    const prevValueRef = useRef(defaultInitial)
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const from = prevValueRef.current
        const to = value
        prevValueRef.current = value

        // Skip animation if value hasn't changed or it's the first render
        if (from === to) {
            setDisplayValue(to)
            return
        }

        const startTime = performance.now()

        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic for a satisfying deceleration
            const eased = 1 - Math.pow(1 - progress, 3)

            const current = Math.round(from + (to - from) * eased)
            setDisplayValue(current)

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                setDisplayValue(to)
            }
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [value, duration])

    return (
        <span className={className} suppressHydrationWarning>
            {formatCurrency(displayValue)}
        </span>
    )
}
