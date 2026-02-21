"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Tag, FolderOpen, FileText } from "lucide-react"

interface SearchSuggestion {
  tags: string[]
  categories: string[]
  articles: Array<{
    id: string
    slug: string
    title: string
    category?: string
    featured_image?: string
  }>
}

export function ArticlesHero({ locale, search }: { locale: string; search?: string }) {
  const t = useTranslations("Articles")
  const router = useRouter()
  const [query, setQuery] = useState(search || "")
  const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query)
      } else {
        setSuggestions(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const fetchSuggestions = async (q: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/articles/search?q=${encodeURIComponent(q)}&locale=${locale}`)
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/${locale}/articles?search=${encodeURIComponent(query)}`)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (type: "tag" | "category" | "article", value: string | { slug: string }) => {
    if (type === "article") {
      const article = value as any
      router.push(`/${locale}/articles/${article.slug}`)
    } else {
      setQuery(typeof value === "string" ? value : "")
      router.push(`/${locale}/articles?search=${encodeURIComponent(typeof value === "string" ? value : "")}`)
    }
    setShowSuggestions(false)
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="max-w-2xl mx-auto text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        {t("title")}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {t("subtitle")}
      </p>

      {/* Search with Autocomplete */}
      <div className="relative" ref={searchRef}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t("searchButton")}
          </button>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && (suggestions.tags.length > 0 || suggestions.categories.length > 0 || suggestions.articles.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {/* Tags */}
            {suggestions.tags.length > 0 && (
              <div className="border-b p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSuggestionClick("tag", tag)}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {suggestions.categories.length > 0 && (
              <div className="border-b p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <FolderOpen className="w-3 h-3" />
                  Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleSuggestionClick("category", cat)}
                      className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-200 transition"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {suggestions.articles.length > 0 && (
              <div className="p-3">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Articles
                </div>
                <div className="space-y-2">
                  {suggestions.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSuggestionClick("article", article)}
                      className="w-full text-left p-2 hover:bg-gray-50 rounded transition"
                    >
                      <div className="font-medium text-sm text-gray-900 line-clamp-1">
                        {article.title}
                      </div>
                      {article.category && (
                        <div className="text-xs text-gray-500">
                          {article.category}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
