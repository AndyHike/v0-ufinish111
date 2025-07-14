"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Building2, Smartphone, Wrench, Package } from "lucide-react"
import { SiteLogo } from "@/components/site-logo"
import { LanguageSwitcher } from "@/components/language-switcher"
import { UserNav } from "@/components/user-nav"
import { MobileNav } from "@/components/mobile-nav"

interface SearchResult {
  id: string
  type: "brand" | "series" | "model" | "service"
  name: string
  slug: string
  url: string
  breadcrumb: string | null
}

interface SearchResponse {
  results: SearchResult[]
  totalResults: number
}

export function Header() {
  const t = useTranslations("Header")
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] || "cs"

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&locale=${locale}`)
        const data: SearchResponse = await response.json()

        setSearchResults(data.results || [])
        setShowResults(true)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, locale])

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchResults.length > 0) {
      router.push(searchResults[0].url)
      setShowResults(false)
      setSearchQuery("")
    } else if (searchQuery.trim()) {
      router.push(`/${locale}/brands`)
      setShowResults(false)
      setSearchQuery("")
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setShowResults(false)
    setSearchQuery("")
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "brand":
        return <Building2 className="h-4 w-4 text-blue-500" />
      case "series":
        return <Package className="h-4 w-4 text-green-500" />
      case "model":
        return <Smartphone className="h-4 w-4 text-purple-500" />
      case "service":
        return <Wrench className="h-4 w-4 text-orange-500" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case "brand":
        return t("brand")
      case "series":
        return t("series")
      case "model":
        return t("model")
      case "service":
        return t("service")
      default:
        return ""
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <SiteLogo />

          {/* Desktop Search */}
          <div className="relative hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    {t("searching")}
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="p-2 text-xs text-muted-foreground border-b">
                      {t("resultsFound", { count: searchResults.length })}
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 flex items-center gap-3"
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{result.name}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.breadcrumb && (
                            <div className="text-xs text-muted-foreground truncate">{result.breadcrumb}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                ) : hasSearched ? (
                  <div className="p-4 text-center text-muted-foreground">{t("noResults", { query: searchQuery })}</div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <UserNav />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
