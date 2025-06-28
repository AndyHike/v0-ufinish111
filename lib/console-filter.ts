"use client"

// Global console filter to remove unwanted logs
export function initConsoleFilter() {
  if (typeof window === "undefined") return

  const originalConsoleLog = console.log
  const originalConsoleInfo = console.info
  const originalConsoleWarn = console.warn

  // List of patterns to filter out
  const filterPatterns = ["[ECOMMERCE]", "processor.js", "Runtime storage save", "Re-init config for url"]

  const shouldFilter = (message: string) => {
    return filterPatterns.some((pattern) => message.includes(pattern))
  }

  console.log = (...args) => {
    const message = args.join(" ")
    if (!shouldFilter(message)) {
      originalConsoleLog.apply(console, args)
    }
  }

  console.info = (...args) => {
    const message = args.join(" ")
    if (!shouldFilter(message)) {
      originalConsoleInfo.apply(console, args)
    }
  }

  console.warn = (...args) => {
    const message = args.join(" ")
    if (!shouldFilter(message)) {
      originalConsoleWarn.apply(console, args)
    }
  }
}

// Restore original console methods
export function restoreConsole() {
  if (typeof window === "undefined") return

  // This would need to store original methods globally to restore them
  // For now, just reload the page to reset console
}
