import Link from "next/link"
import { ChevronDown } from "lucide-react"

import type { ShopCategoryTreeNode, ShopLocale, ShopLocalizedText } from "@/lib/shop/types"

function getText(value: ShopLocalizedText, locale: ShopLocale): string {
  return value[locale] ?? value.cs ?? value.en ?? ""
}

function SidebarTree({
  locale,
  nodes,
  depth = 0,
}: {
  locale: ShopLocale
  nodes: ShopCategoryTreeNode[]
  depth?: number
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-gray-200 pl-3"}>
      {nodes.map((node) => {
        const title = getText(node.category.title, locale)
        const hasChildren = node.children.length > 0
        const toggleId = `shop-category-${node.category.id}`

        return (
          <li key={node.category.id}>
            <div className="group/category">
              {hasChildren ? <input id={toggleId} type="checkbox" className="peer sr-only" /> : null}
              <div className="flex items-center gap-1 rounded-md transition hover:bg-gray-100">
                <Link
                  href={`/${locale}/category/${node.category.slug}`}
                  className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${
                    depth === 0 ? "font-semibold text-gray-950" : "font-medium text-gray-600"
                  }`}
                >
                  {title}
                </Link>
                {hasChildren ? (
                  <label
                    htmlFor={toggleId}
                    aria-label={`Expand ${title}`}
                    className="mr-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 transition hover:bg-white hover:text-gray-950 peer-checked:rotate-180"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </label>
                ) : null}
              </div>
              {hasChildren ? (
                <div className="hidden peer-checked:block">
                  <SidebarTree locale={locale} nodes={node.children} depth={depth + 1} />
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ShopCategorySidebar({
  locale,
  nodes,
  title,
  className = "",
}: {
  locale: ShopLocale
  nodes: ShopCategoryTreeNode[]
  title: string
  className?: string
}) {
  return (
    <aside className={`bg-white ${className}`}>
      <div className="px-4 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">{title}</h2>
        <div className="mt-4">
          <SidebarTree locale={locale} nodes={nodes} />
        </div>
      </div>
    </aside>
  )
}
