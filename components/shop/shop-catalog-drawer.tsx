"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, LayoutGrid, Menu, Package, X } from "lucide-react"

import type { ShopCategoryTreeNode, ShopLocale, ShopLocalizedText } from "@/lib/shop/types"

const DRAWER_COPY: Record<ShopLocale, { trigger: string; title: string; close: string }> = {
  cs: { trigger: "Katalog", title: "Katalog", close: "Zavrit" },
  uk: { trigger: "Каталог", title: "Каталог", close: "Закрити" },
  en: { trigger: "Catalog", title: "Catalog", close: "Close" },
}

function getText(value: ShopLocalizedText, locale: ShopLocale): string {
  return value[locale] ?? value.cs ?? value.en ?? ""
}

function DrawerNode({
  locale,
  node,
  depth,
  onNavigate,
}: {
  locale: ShopLocale
  node: ShopCategoryTreeNode
  depth: number
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(false)
  const title = getText(node.category.title, locale)
  const hasChildren = node.children.length > 0
  const image = node.category.imageUrl

  return (
    <div>
      <div className="flex items-center rounded-lg transition hover:bg-gray-100">
        <Link
          href={`/${locale}/category/${node.category.slug}`}
          onClick={onNavigate}
          className={`flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 ${
            depth === 0 ? "text-sm font-medium text-gray-900" : "text-sm text-gray-600"
          }`}
        >
          {depth === 0 ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
              {image ? (
                <Image src={image} alt="" width={28} height={28} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-[18px] w-[18px]" />
              )}
            </span>
          ) : null}
          <span className="min-w-0 truncate">{title}</span>
        </Link>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={title}
            aria-expanded={open}
            className="mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-gray-900"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : null}
      </div>
      {hasChildren && open ? (
        <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-2">
          {node.children.map((child) => (
            <DrawerNode key={child.category.id} locale={locale} node={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ShopCatalogDrawer({
  locale,
  nodes,
  variant = "button",
  triggerClassName = "",
}: {
  locale: ShopLocale
  nodes: ShopCategoryTreeNode[]
  variant?: "button" | "icon"
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const copy = DRAWER_COPY[locale]
  const close = () => setOpen(false)

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={copy.trigger}
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-800 transition hover:bg-gray-50 ${triggerClassName}`}
        >
          <Menu className="h-5 w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 ${triggerClassName}`}
        >
          <LayoutGrid className="h-4 w-4" />
          {copy.trigger}
        </button>
      )}

      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label={copy.close}
          onClick={close}
          className={`absolute inset-0 bg-gray-950/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{copy.title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {nodes.map((node) => (
              <DrawerNode key={node.category.id} locale={locale} node={node} depth={0} onNavigate={close} />
            ))}
          </nav>
        </aside>
      </div>
    </>
  )
}
