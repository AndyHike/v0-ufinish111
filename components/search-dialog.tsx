"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Smartphone, X, Building2, Layers, Wrench } from "lucide-react"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: number
  type: "model" | "brand" | "series" | "service"
  name: string
  slug: string
  url: string
  breadcrumb?: string | null
}

interface SearchResults {
  models: SearchResult[]
  brands: SearchResult[]
  series: SearchResult[]
  services: SearchResult[]
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const t = useTranslations("Search")
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || "cs"

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({
    models: [],
    brands: [],
    series: [],
    services: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [totalResults, setTotalResults] = useState(0)

  // Пошук з debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true)
        try {
          console.log(`🔍 Searching for "${query}" in locale "${locale}"`)

          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`)
          const data = await response.json()

          if (data.results) {
            setResults(data.results)
            setTotalResults(data.totalResults || 0)
            console.log(`✅ Search results:`, data.results)
          }
        } catch (error) {
          console.error("❌ Search error:", error)
          setResults({ models: [], brands: [], series: [], services: [] })
          setTotalResults(0)
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults({ models: [], brands: [], series: [], services: [] })
        setTotalResults(0)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, locale])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query && results.models.length > 0) {
      // Перехід до першої знайденої моделі
      router.push(results.models[0].url)
      onOpenChange(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    console.log(`🔗 Navigating to: ${result.url}`)
    router.push(result.url)
    onOpenChange(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "model":
        return <Smartphone className="h-4 w-4" />
      case "brand":
        return <Building2 className="h-4 w-4" />
      case "series":
        return <Layers className="h-4 w-4" />
      case "service":
        return <Wrench className="h-4 w-4" />
      default:
        return <Smartphone className="h-4 w-4" />
    }
  }

  const renderResultSection = (title: string, items: SearchResult[], type: string) => {
    if (items.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h3>
        <ul className="space-y-1">
          {items.map((result) => (
            <li key={`${result.type}-${result.id}`}>
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2 px-3"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center w-full">
                  <div className="mr-3 flex-shrink-0">{getResultIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.name}</div>
                    {result.breadcrumb && (
                      <div className="text-xs text-muted-foreground truncate">{result.breadcrumb}</div>
                    )}
                  </div>
                </div>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("placeholder")}
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">{t("clear")}</span>
              </Button>
            )}
          </div>
          <Button type="submit" disabled={isLoading || query.length < 2}>
            {isLoading ? "..." : t("search")}
          </Button>
        </form>

        {query.length >= 2 && (
          <div className="mt-4 max-h-[400px] overflow-auto">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">{t("searching")}...</div>
            ) : totalResults > 0 ? (
              <div>
                <div className="mb-3 text-sm text-muted-foreground">
                  {t("found")} {totalResults} {t("results")}
                </div>

                {renderResultSection(t("models"), results.models, "model")}
                {renderResultSection(t("brands"), results.brands, "brand")}
                {renderResultSection(t("series"), results.series, "series")}
                {renderResultSection(t("services"), results.services, "service")}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">{t("noResults")}</div>
            )}
          </div>
        )}

        {query.length > 0 && query.length < 2 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">{t("minChars")}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
