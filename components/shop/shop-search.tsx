"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Loader2, Search, X } from "lucide-react"

import type { ShopLocale } from "@/lib/shop/types"

interface SearchResult {
  itemId: string
  title: string
  href: string
  image: string
  price: string
  priceFrom: boolean
  availabilityLabel: string
  isPurchasable: boolean
}

const SEARCH_COPY = {
  cs: { placeholder: "Hledat produkty", empty: "Nic nenalezeno", from: "od", search: "Hledat", close: "Zavrit", hint: "Zadejte alespon 2 znaky" },
  uk: { placeholder: "Пошук товарів", empty: "Нічого не знайдено", from: "від", search: "Пошук", close: "Закрити", hint: "Введіть щонайменше 2 символи" },
  en: { placeholder: "Search products", empty: "Nothing found", from: "from", search: "Search", close: "Close", hint: "Type at least 2 characters" },
} as const

const MIN_QUERY = 2
const DEBOUNCE_MS = 250

function useProductSearch(locale: ShopLocale, query: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const response = await fetch(`/api/shop/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`)
        const data = (await response.json()) as { results?: SearchResult[] }
        if (!cancelled) {
          setResults(data.results ?? [])
        }
      } catch {
        if (!cancelled) {
          setResults([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [locale, query])

  return { results, loading }
}

function ResultList({
  copy,
  loading,
  query,
  results,
  onNavigate,
}: {
  copy: (typeof SEARCH_COPY)[ShopLocale]
  loading: boolean
  query: string
  results: SearchResult[]
  onNavigate: () => void
}) {
  if (query.trim().length < MIN_QUERY) {
    return <p className="px-4 py-6 text-center text-sm text-gray-500">{copy.hint}</p>
  }

  if (loading && results.length === 0) {
    return (
      <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
      </p>
    )
  }

  if (results.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-gray-500">{copy.empty}</p>
  }

  return (
    <ul className="max-h-[60vh] overflow-y-auto py-1">
      {results.map((result) => (
        <li key={result.itemId}>
          <Link
            href={result.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 transition hover:bg-gray-50"
          >
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
              <Image src={result.image} alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-sm font-medium text-gray-900">{result.title}</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {result.priceFrom ? `${copy.from} ` : ""}
                {result.price}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ShopSearch({ locale }: { locale: ShopLocale }) {
  const copy = SEARCH_COPY[locale]
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { results, loading } = useProductSearch(locale, query)

  useEffect(() => setMounted(true), [])

  // Close desktop dropdown on outside click.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDesktopOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  // Lock body scroll while the mobile overlay is open.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  const closeAll = () => {
    setDesktopOpen(false)
    setMobileOpen(false)
  }

  const submit = () => {
    if (results.length > 0) {
      router.push(results[0].href)
      closeAll()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      submit()
    }
    if (event.key === "Escape") {
      closeAll()
    }
  }

  return (
    <>
      {/* Desktop inline search */}
      <div ref={containerRef} className="relative hidden md:block md:w-64 lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setDesktopOpen(true)
          }}
          onFocus={() => setDesktopOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={copy.placeholder}
          aria-label={copy.search}
          className="h-9 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-gray-950"
        />
        {desktopOpen && query.trim().length >= 1 ? (
          <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <ResultList copy={copy} loading={loading} query={query} results={results} onNavigate={closeAll} />
          </div>
        ) : null}
      </div>

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={copy.search}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-700 transition hover:bg-gray-50 md:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Mobile overlay (portal to escape the header's backdrop-filter context) */}
      {mounted && mobileOpen
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex flex-col bg-black/40">
              <div className="bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={copy.placeholder}
                      aria-label={copy.search}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-gray-950"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={closeAll}
                    aria-label={copy.close}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-700 transition hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                  <ResultList copy={copy} loading={loading} query={query} results={results} onNavigate={closeAll} />
                </div>
              </div>
              <button type="button" className="flex-1" aria-label={copy.close} onClick={closeAll} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
