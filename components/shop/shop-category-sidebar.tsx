import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight, Package } from "lucide-react"

import type { ShopCategoryTreeNode, ShopLocale, ShopLocalizedText } from "@/lib/shop/types"

function getText(value: ShopLocalizedText, locale: ShopLocale): string {
  return value[locale] ?? value.cs ?? value.en ?? ""
}

const ALL_LABEL: Record<ShopLocale, string> = {
  cs: "Zobrazit vse",
  uk: "Усі товари",
  en: "View all",
}

function MobileSubtree({
  locale,
  nodes,
}: {
  locale: ShopLocale
  nodes: ShopCategoryTreeNode[]
}) {
  return (
    <ul className="space-y-0.5 border-l border-gray-200 py-1 pl-4">
      {nodes.map((node) => {
        const title = getText(node.category.title, locale)
        const hasChildren = node.children.length > 0

        return (
          <li key={node.category.id}>
            <Link
              href={`/${locale}/category/${node.category.slug}`}
              className="block rounded-md px-2 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-950"
            >
              {title}
            </Link>
            {hasChildren ? <MobileSubtree locale={locale} nodes={node.children} /> : null}
          </li>
        )
      })}
    </ul>
  )
}

function CategoryFlyout({
  locale,
  node,
}: {
  locale: ShopLocale
  node: ShopCategoryTreeNode
}) {
  const title = getText(node.category.title, locale)
  const rootHref = `/${locale}/category/${node.category.slug}`
  const image = node.category.imageUrl

  return (
    <div className="invisible absolute left-full top-0 z-30 hidden min-h-full w-[420px] pl-3 opacity-0 transition-[opacity] duration-150 lg:block lg:group-hover/cat:visible lg:group-hover/cat:opacity-100 xl:w-[560px]">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_180px]">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-950">{title}</h3>
              <Link href={rootHref} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                {ALL_LABEL[locale]}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
              {node.children.map((child) => {
                const childTitle = getText(child.category.title, locale)

                return (
                  <div key={child.category.id} className="min-w-0">
                    <Link
                      href={`/${locale}/category/${child.category.slug}`}
                      className="block truncate text-sm font-semibold text-gray-900 transition hover:text-primary"
                    >
                      {childTitle}
                    </Link>
                    {child.children.length > 0 ? (
                      <ul className="mt-2 space-y-1.5">
                        {child.children.map((grandChild) => (
                          <li key={grandChild.category.id}>
                            <Link
                              href={`/${locale}/category/${grandChild.category.slug}`}
                              className="block truncate text-[13px] leading-5 text-gray-500 transition hover:text-gray-950"
                            >
                              {getText(grandChild.category.title, locale)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          {image ? (
            <Link
              href={rootHref}
              className="relative hidden min-h-[180px] overflow-hidden rounded-xl bg-gray-100 xl:block"
            >
              <Image src={image} alt={title} fill sizes="180px" className="object-cover" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function RootCategory({
  locale,
  node,
}: {
  locale: ShopLocale
  node: ShopCategoryTreeNode
}) {
  const title = getText(node.category.title, locale)
  const image = node.category.imageUrl
  const hasChildren = node.children.length > 0
  const toggleId = `shop-cat-${node.category.id}`

  return (
    <li className="group/cat relative">
      {hasChildren ? <input id={toggleId} type="checkbox" className="peer sr-only" /> : null}

      <div className="flex items-center rounded-lg transition hover:bg-gray-100 lg:group-hover/cat:bg-gray-100">
        <Link
          href={`/${locale}/category/${node.category.slug}`}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400 transition group-hover/cat:text-gray-900">
            {image ? (
              <Image src={image} alt="" width={28} height={28} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-[18px] w-[18px]" />
            )}
          </span>
          <span className="min-w-0 truncate text-sm font-medium text-gray-800 transition group-hover/cat:text-gray-950">
            {title}
          </span>
        </Link>

        {hasChildren ? (
          <>
            <label
              htmlFor={toggleId}
              aria-label={`Expand ${title}`}
              className="mr-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-400 transition hover:bg-white hover:text-gray-950 peer-checked:rotate-180 lg:hidden"
            >
              <ChevronDown className="h-4 w-4" />
            </label>
            <ChevronRight className="mr-2 hidden h-4 w-4 shrink-0 text-gray-300 transition group-hover/cat:text-gray-500 lg:block" />
          </>
        ) : null}
      </div>

      {hasChildren ? (
        <>
          <div className="hidden peer-checked:block lg:!hidden">
            <MobileSubtree locale={locale} nodes={node.children} />
          </div>
          <CategoryFlyout locale={locale} node={node} />
        </>
      ) : null}
    </li>
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
      <div className="px-3 py-4">
        <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{title}</h2>
        <ul className="mt-3 space-y-0.5">
          {nodes.map((node) => (
            <RootCategory key={node.category.id} locale={locale} node={node} />
          ))}
        </ul>
      </div>
    </aside>
  )
}
