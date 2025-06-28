"use client"

import { useEffect } from "react"

export function ConsoleBlocker() {
  useEffect(() => {
    // Відключаємо всі console методи в production
    if (process.env.NODE_ENV === "production") {
      const noop = () => {}

      // Зберігаємо оригінальні методи на випадок якщо потрібно буде відновити
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
        trace: console.trace,
        group: console.group,
        groupEnd: console.groupEnd,
        groupCollapsed: console.groupCollapsed,
        time: console.time,
        timeEnd: console.timeEnd,
        count: console.count,
        assert: console.assert,
        clear: console.clear,
        dir: console.dir,
        dirxml: console.dirxml,
        table: console.table,
      }

      // Відключаємо всі console методи
      console.log = noop
      console.warn = noop
      console.error = noop
      console.info = noop
      console.debug = noop
      console.trace = noop
      console.group = noop
      console.groupEnd = noop
      console.groupCollapsed = noop
      console.time = noop
      console.timeEnd = noop
      console.count = noop
      console.assert = noop
      console.clear = noop
      console.dir = noop
      console.dirxml = noop
      console.table = noop

      // Також блокуємо console.log через window
      if (typeof window !== "undefined") {
        ;(window as any).console = {
          ...originalConsole,
          log: noop,
          warn: noop,
          error: noop,
          info: noop,
          debug: noop,
          trace: noop,
          group: noop,
          groupEnd: noop,
          groupCollapsed: noop,
          time: noop,
          timeEnd: noop,
          count: noop,
          assert: noop,
          clear: noop,
          dir: noop,
          dirxml: noop,
          table: noop,
        }
      }

      // Блокуємо також через Object.defineProperty
      Object.defineProperty(window, "console", {
        value: {
          log: noop,
          warn: noop,
          error: noop,
          info: noop,
          debug: noop,
          trace: noop,
          group: noop,
          groupEnd: noop,
          groupCollapsed: noop,
          time: noop,
          timeEnd: noop,
          count: noop,
          assert: noop,
          clear: noop,
          dir: noop,
          dirxml: noop,
          table: noop,
        },
        writable: false,
        configurable: false,
      })

      // Cleanup function для відновлення console в development
      return () => {
        if (process.env.NODE_ENV === "development") {
          Object.assign(console, originalConsole)
        }
      }
    }
  }, [])

  return null
}
