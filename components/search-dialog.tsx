"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Smartphone, X } from "lucide-react"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock search results - in a real app, this would come from your API
const mockResults = [
  { id: 1, type: "brand", name: "Apple" },
  { id: 2, type: "brand", name: "Samsung" },
  { id: 3, type: "model", name: "iPhone 13" },
  { id: 4, type: "model", name: "Galaxy S21" },
  { id: 5, type: "service", name: "Screen Replacement" },
]

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const t = useTranslations("Search")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    if (query.length > 1) {
      // In a real app, you would fetch results from your API
      const filtered = mockResults.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      setResults(filtered)
    } else {
      setResults([])
    }
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      onOpenChange(false)
    }
  }

  const handleResultClick = (result: any) => {
    // Navigate to the appropriate page based on result type
    let url = "/"
    if (result.type === "brand") {
      url = `/brands/${result.id}`
    } else if (result.type === "model") {
      url = `/models/${result.id}`
    } else if (result.type === "service") {
      url = `/services/${result.id}`
    }
    router.push(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
          <Button type="submit">{t("search")}</Button>
        </form>
        {results.length > 0 && (
          <div className="mt-4 max-h-[300px] overflow-auto">
            <h3 className="mb-2 text-sm font-medium">{t("results")}</h3>
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={result.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left"
                    onClick={() => handleResultClick(result)}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    <span>{result.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{t(result.type)}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
