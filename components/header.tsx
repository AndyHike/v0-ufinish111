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

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`)
      const data = await response.json()

      if (data.results) {
        setSearchResults(data.results || [])
        setShowResults(true)
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
    }, 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Якщо є результати, перейти до першого
      if (searchResults.length > 0) {
        router.push(searchResults[0].url)
        setShowResults(false)
        setSearchQuery("")
      } else {
        // Якщо немає результатів, перейти на сторінку брендів
        router.push(`/${locale}/brands`)
        setShowResults(false)
      }
    }
  }

  const handleResultClick = (result: SearchResult) => {
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
          <nav className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${
                  isActive(item.href) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0 md:min-w-auto">
            <LanguageSwitcher className="flex" />
            <div className="relative" ref={searchInputRef}>
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative">
                  {isSearching ? (
                    <Loader2 className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
                  ) : (
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  )}
                  <input
                    type="text"
                    placeholder={t("search") || "Пошук..."}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      if (searchQuery.length >= 2) {
                        setShowResults(true)
                      }
                    }}
                    className="w-48 pl-8 pr-3 py-1.5 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </form>

              {/* Випадаюче вікно з результатами */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-auto">
                  {isSearching ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      Пошук...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
                        Знайдено {searchResults.length} результатів
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-3 border-b border-border last:border-b-0 transition-colors"
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="capitalize bg-muted px-1.5 py-0.5 rounded">
                                {result.type === "model"
                                  ? "Модель"
                                  : result.type === "brand"
                                    ? "Бренд"
                                    : result.type === "series"
                                      ? "Серія"
                                      : "Послуга"}
                              </span>
                              {result.breadcrumb && <span className="truncate">{result.breadcrumb}</span>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : hasSearched ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Нічого не знайдено для "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <UserNav user={user} />
          </div>
        </div>
      </header>

      <MobileNav navigation={navigation} isActive={isActive} />
    </>
  )
}
