"use client"

import { useState } from "react"
import { usePathname, useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface LanguageSwitcherProps {
  className?: string
}

// SVG Flag Icons
const FlagIcons = {
  uk: (
    <svg className="w-5 h-5" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="300" fill="#4373E6" />
      <rect y="300" width="900" height="300" fill="#FFD500" />
    </svg>
  ),
  cs: (
    <svg className="w-5 h-5" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="600" fill="#FFFFFF" />
      <rect y="300" width="900" height="300" fill="#D00000" />
      <polygon points="0,0 450,300 0,600" fill="#11457E" />
    </svg>
  ),
  en: (
    <svg className="w-5 h-5" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <rect width="900" height="600" fill="#012169" />
      <path d="M0,0 L900,600 M900,0 L0,600" stroke="white" strokeWidth="120" />
      <path d="M0,0 L900,600 M900,0 L0,600" stroke="#C8102E" strokeWidth="60" />
      <path d="M450,0 V600 M0,300 H900" stroke="white" strokeWidth="200" />
      <path d="M450,0 V600 M0,300 H900" stroke="#C8102E" strokeWidth="120" />
    </svg>
  ),
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = (params.locale as string) || "cs" // Default to Czech if no locale
  const currentLocale = locale
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: "uk", name: "Українська", shortCode: "UA" },
    { code: "cs", name: "Čeština", shortCode: "CZ" },
    { code: "en", name: "English", shortCode: "EN" },
  ]

  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === currentLocale) {
      setIsOpen(false)
      return
    }

    // Get the current path segments
    const segments = pathname.split("/").filter(Boolean) // Remove empty segments

    // If we're on the root (no locale in path), just prepend the new locale
    if (segments.length === 0 || !["uk", "cs", "en"].includes(segments[0])) {
      const newPath = `/${newLocale}`
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
      router.push(newPath)
      setIsOpen(false)
      return
    }

    // Replace the locale segment (first segment)
    segments[0] = newLocale

    // Check if this is an article page and we need to fetch the localized slug
    if (segments.length >= 2 && segments[1] === "articles") {
      const currentSlug = segments[2]
      try {
        // Fetch the localized slug for this article in the new language
        const url = `/api/articles/by-slug?slug=${encodeURIComponent(currentSlug)}&locale=${newLocale}`
        const response = await fetch(url)
        
        if (response.ok) {
          const article = await response.json()
          // The API returns article data with article_translations array
          // We need to get the slug for the new locale from article_translations
          const allTranslations = article.article_translations || []
          const targetTranslation = allTranslations.find((t: any) => t.locale === newLocale)
          segments[2] = targetTranslation?.slug || article.slug || currentSlug
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("Failed to fetch article:", { status: response.status, error: errorData.error })
        }
      } catch (error) {
        console.error("Failed to fetch localized article slug:", error)
        // Fallback to current slug if API call fails
      }
    }

    // Reconstruct the path with the new locale
    const newPath = `/${segments.join("/")}`

    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    // Preserve URL parameters
    const currentParams = new URLSearchParams(searchParams.toString())
    const queryString = currentParams.toString()
    const finalPath = queryString ? `${newPath}?${queryString}` : newPath

    // Use router.push for smoother navigation
    router.push(finalPath)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} title={`Current language: ${languages.find((l) => l.code === currentLocale)?.name}`}>
          <span className="w-5 h-5">{FlagIcons[currentLocale as keyof typeof FlagIcons]}</span>
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={currentLocale === language.code ? "font-medium bg-accent" : ""}
          >
            <span className="mr-2 w-5 h-5">{FlagIcons[language.code as keyof typeof FlagIcons]}</span>
            <span className="text-xs font-semibold text-muted-foreground mr-2">{language.shortCode}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
