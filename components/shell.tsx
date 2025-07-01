"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional tailwind classes to extend/override the default container.
   */
  className?: string
}

/**
 * Generic page-level container that provides a centered,
 * padded layout.
 * Feel free to adjust break-points / padding to match your design system.
 */
export function Shell({ children, className, ...props }: ShellProps) {
  return (
    <div
      {...props}
      className={cn(
        /* Default max-width with horizontal padding */
        "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Shell
