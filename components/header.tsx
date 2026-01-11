"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Smartphone,
  Search,
  Phone,
  Mail,
  MapPin,
  Home,
  MessageSquare,
  Loader2,
  Building2,
  Layers,
  Wrench,
} from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { UserNav } from "@/components/user-nav"
import { useState, useEffect, useRef } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { useSiteSettings } from "@/hooks/use-site-settings"

interface SearchResult {
  id: number
  type: "model" | "brand" | "series" | "service"
  name: string
  slug: string
  url: string
  breadcrumb?: string | null
}

export function Header({ user }) {
  const t = useTranslations("Header")
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isFirstSearch, setIsFirstSearch] = useState(true)
  const lastSearchQueryRef = useRef("")
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { settings } = useSiteSettings()

  const navigation = [
    { name: t("home"), href: `/${locale}`, icon: <Home className="h-5 w-5" /> },
    { name: t("chooseModel"), href: `/${locale}/brands`, icon: <Smartphone className="h-5 w-5" /> },
    { name: t("contact"), href: `/${locale}/contact`, icon: <MessageSquare className="h-5 w-5" /> },
  ]

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === `/${locale}`) {
      return pathname === `/${locale}`
    }
    return pathname.startsWith(path)
  }

  // ВИПРАВЛЕНО: Функція для відправки події пошуку (тільки при реальному пошуку)
  const trackSearchEvent = (query: string, resultsCount: number) => {
    // Уникаємо дублювання - відправляємо тільки якщо запит змінився
    if (typeof window !== "undefined" && window.fbq && query !== lastSearchQueryRef.current && query.length >= 3) {
      window.fbq("track", "Search", {
        search_string: query,
        content_category: "site_search",
        custom_parameters: {
          results_count: resultsCount,
          search_length: query.length,
          page_url: window.location.href,
        },
      })
      lastSearchQueryRef.current = query
    }
  }

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      setHasSearched(false)
      setIsFirstSearch(true)
      return
    }

    // Показуємо спінер тільки при першому пошуку
    if (isFirstSearch) {
      setIsSearching(true)
    }
    setHasSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`)
      const data = await response.json()

      if (data.results) {
        setSearchResults(data.results || [])
        setShowResults(true)

        // ВИПРАВЛЕНО: Відправляємо подію пошуку тільки для запитів >= 3 символи
        if (query.length >= 3) {
          trackSearchEvent(query, data.results.length)
        }
      } else {
        setSearchResults([])
        setShowResults(true)
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
      setShowResults(true)
    } finally {
      setIsSearching(false)
      setIsFirstSearch(false)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query)
    }, 400)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // ВИПРАВЛЕНО: Відправляємо подію пошуку при submit
      trackSearchEvent(searchQuery.trim(), searchResults.length)

      // Якщо є результати, перейти до першого
      if (searchResults.length > 0) {
        handleResultClick(searchResults[0])
      } else {
        // Якщо немає результатів, перейти на сторінку брендів
        router.push(`/${locale}/brands`)
        setShowResults(false)
      }
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // ВИПРАВЛЕНО: Відстеження кліку на результат пошуку з детальними параметрами
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_type: result.type,
        content_name: result.name,
        content_category: "search_result",
        custom_parameters: {
          search_query: searchQuery,
          result_position: searchResults.findIndex((r) => r.id === result.id) + 1,
          result_type: result.type,
          total_results: searchResults.length,
        },
      })
    }

    router.push(result.url)
    setShowResults(false)
    setSearchQuery("")
    searchInputRef.current?.blur()
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "model":
        return <Smartphone className="h-4 w-4 text-blue-500" />
      case "brand":
        return <Building2 className="h-4 w-4 text-green-500" />
      case "series":
        return <Layers className="h-4 w-4 text-purple-500" />
      case "service":
        return <Wrench className="h-4 w-4 text-orange-500" />
      default:
        return <Smartphone className="h-4 w-4" />
    }
  }

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case "model":
        return t("searchResultTypes.model")
      case "brand":
        return t("searchResultTypes.brand")
      case "series":
        return t("searchResultTypes.series")
      case "service":
        return t("searchResultTypes.service")
      default:
        return ""
    }
  }

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-2 md:px-4">
          {/* Логотип */}
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t("openMenu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-2 border-b py-4">
                    {settings.siteLogo && (
                      <img
                        src={settings.siteLogo || "/placeholder.svg"}
                        alt="DeviceHelp"
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                        }}
                      />
                    )}
                    <span className="font-semibold">DeviceHelp</span>
                  </div>
                  <nav className="flex-1 overflow-auto py-4">
                    <ul className="grid gap-2">
                      {navigation.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center rounded-md px-3 py-3 text-sm hover:bg-accent ${
                              isActive(item.href) ? "font-medium text-foreground bg-accent/50" : "text-muted-foreground"
                            }`}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t py-4 space-y-4">
                    <div className="px-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-sm">+42075848259</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm">info@devicehelp.cz</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm">Praha 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href={`/${locale}`} className="flex items-center gap-2">
              {settings.siteLogo && (
                <img
                  src={settings.siteLogo || "/placeholder.svg"}
                  alt="DeviceHelp"
                  className="h-8 w-8 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              )}
              <span className="font-semibold md:truncate-none truncate">DeviceHelp</span>
            </Link>
          </div>

          {/* Пошук між логотипом та навігацією */}
          <div className="hidden md:flex flex-1 max-w-md mx-6" ref={searchInputRef}>
            <div className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative w-full">
                  {isSearching && isFirstSearch ? (
                    <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      if (searchQuery.length >= 2) {
                        setShowResults(true)
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </form>

              {/* Випадаюче вікно з результатами */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-auto min-w-[500px]">
                  {isSearching && isFirstSearch ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      {t("searchLoading")}
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                        {t("searchResultsFound", { count: searchResults.length })}
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 text-left hover:bg-accent flex items-start gap-3 border-b border-border last:border-b-0 transition-colors"
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm leading-relaxed break-words">{result.name}</span>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full whitespace-nowrap">
                                {getResultTypeLabel(result.type)}
                              </span>
                            </div>
                            {result.breadcrumb && (
                              <div className="text-xs text-muted-foreground leading-relaxed break-words">
                                {result.breadcrumb}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : hasSearched ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      {t("searchNoResults", { query: searchQuery })}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Навігація */}
          <nav className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm whitespace-nowrap ${
                  isActive(item.href) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Мова та користувач */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSwitcher className="flex" />
            <UserNav user={user} />
          </div>
        </div>
      </header>

      <MobileNav />
    </>
  )
}
