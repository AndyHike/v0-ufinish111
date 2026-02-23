import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface NavItem {
    name: string
    href: string
}

interface PrevNextNavProps {
    prev?: NavItem | null
    next?: NavItem | null
    label?: string
}

/**
 * Prev/Next navigation bar for improving internal linking between
 * adjacent brands, models, series, and service pages.
 *
 * Renders two buttons (← Previous / Next →) at the bottom of a page.
 * Helps Google discover adjacent pages and reduces orphaned-page issues.
 */
export function PrevNextNav({ prev, next, label }: PrevNextNavProps) {
    if (!prev && !next) return null

    return (
        <nav
            aria-label={label || "Page navigation"}
            className="flex items-center justify-between gap-4 mt-12 pt-8 border-t border-gray-100"
        >
            {prev ? (
                <Link
                    href={prev.href}
                    className="group flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm max-w-[45%]"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                    <span className="text-gray-500 group-hover:text-blue-600 truncate transition-colors">
                        {prev.name}
                    </span>
                </Link>
            ) : (
                <div />
            )}

            {next ? (
                <Link
                    href={next.href}
                    className="group flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm max-w-[45%] text-right"
                >
                    <span className="text-gray-500 group-hover:text-blue-600 truncate transition-colors">
                        {next.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </Link>
            ) : (
                <div />
            )}
        </nav>
    )
}
