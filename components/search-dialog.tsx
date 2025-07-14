"use client"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, Smartphone, X, Building2, Layers, Wrench } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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

  // Пошук з debounce
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true)
        try {
          console.log(`🔍 Searching for "${query}" in locale "${locale}"`)

          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`)
          const data = await response.json()

          console.log("📊 Search response:", data)

          if (data.results) {
            setResults(data.results)
          } else {
            setResults({ models: [], brands: [], series: [], services: [] })
          }
        } catch (error) {
          console.error("❌ Search error:", error)
          setResults({ models: [], brands: [], series: [], services: [] })
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults({ models: [], brands: [], series: [], services: [] })
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, locale])

  const handleResultClick = (result: SearchResult) => {
    console.log(`🔗 Navigating to: ${result.url}`)
    router.push(result.url)
    onOpenChange(false)
    setQuery("")
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

  const totalResults = results.models.length + results.brands.length + results.series.length + results.services.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[640px]">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={t("placeholder")}
              value={query}
              onValueChange={setQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <CommandList className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{t("searching")}...</div>
            ) : query.length >= 2 && totalResults === 0 ? (
              <CommandEmpty className="py-6 text-center text-sm">{t("noResults")}</CommandEmpty>
            ) : (
              <>
                {results.models.length > 0 && (
                  <CommandGroup heading={t("models")}>
                    {results.models.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={result.name}
                        onSelect={() => handleResultClick(result)}
                        className="cursor-pointer"
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.brands.length > 0 && (
                  <CommandGroup heading={t("brands")}>
                    {results.brands.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={result.name}
                        onSelect={() => handleResultClick(result)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center w-full">
                          <div className="mr-3 flex-shrink-0">{getResultIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.series.length > 0 && (
                  <CommandGroup heading={t("series")}>
                    {results.series.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={result.name}
                        onSelect={() => handleResultClick(result)}
                        className="cursor-pointer"
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.services.length > 0 && (
                  <CommandGroup heading={t("services")}>
                    {results.services.map((result) => (
                      <CommandItem
                        key={`${result.type}-${result.id}`}
                        value={result.name}
                        onSelect={() => handleResultClick(result)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center w-full">
                          <div className="mr-3 flex-shrink-0">{getResultIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.name}</div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
