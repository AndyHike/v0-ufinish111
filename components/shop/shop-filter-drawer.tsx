"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"

export function ShopFilterDrawer({
  triggerLabel,
  closeLabel,
  activeCount,
  children,
}: {
  triggerLabel: string
  closeLabel: string
  activeCount: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-900 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {triggerLabel}
        {activeCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-950 px-1.5 text-xs font-semibold text-white">
            {activeCount}
          </span>
        ) : null}
      </button>

      {/* Backdrop (mobile only) */}
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label={closeLabel}
        onClick={close}
        className={`fixed inset-0 z-40 bg-gray-950/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over on mobile; plain block in the sidebar column on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-200 lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:overflow-visible lg:bg-transparent lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={triggerLabel}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 lg:hidden">
          <span className="text-sm font-semibold text-gray-950">{triggerLabel}</span>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
