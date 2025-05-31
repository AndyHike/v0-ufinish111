"use client"

import { useCallback } from "react"

/**
 * A hook that provides safe focus management functions to prevent accessibility issues
 */
export function useSafeFocus() {
  /**
   * Safely prevents default focus behavior for dialogs and dropdowns
   */
  const preventAutoFocus = useCallback((event: Event) => {
    event.preventDefault()
  }, [])

  /**
   * Safely returns focus to a specific element
   */
  const returnFocusTo = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === "function") {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        element.focus({ preventScroll: true })
      }, 10)
    }
  }, [])

  return {
    preventAutoFocus,
    returnFocusTo,
  }
}
